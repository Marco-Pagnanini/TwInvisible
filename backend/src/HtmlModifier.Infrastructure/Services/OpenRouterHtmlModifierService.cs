using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using HtmlModifier.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HtmlModifier.Infrastructure.Services;

public class OpenRouterHtmlModifierService : IAiHtmlModifierService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly string _baseUrl;
    private readonly ILogger<OpenRouterHtmlModifierService> _logger;

    private const int MaxRetries = 3;

    public OpenRouterHtmlModifierService(HttpClient httpClient, IConfiguration configuration, ILogger<OpenRouterHtmlModifierService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["OpenRouter:ApiKey"]
            ?? throw new InvalidOperationException("OpenRouter:ApiKey is not configured.");
        _model = configuration["OpenRouter:Model"] ?? "llama-3.3-70b-versatile";
        _baseUrl = configuration["OpenRouter:BaseUrl"] ?? "https://api.groq.com/openai/v1";
    }

    public async Task<string> ModifyHtmlAsync(string html, string instructions, CancellationToken cancellationToken = default)
    {
        var prompt = BuildPrompt(html, instructions);

        var requestBody = new ChatCompletionRequest
        {
            Model = _model,
            Messages =
            [
                new Message { Role = "system", Content = "You are an HTML modifier assistant. Return ONLY the modified HTML, nothing else. No markdown fences, no explanations." },
                new Message { Role = "user", Content = prompt }
            ]
        };

        var url = $"{_baseUrl.TrimEnd('/')}/chat/completions";

        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(requestBody);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                if (attempt == MaxRetries)
                {
                    _logger.LogError("API rate limit exceeded after {MaxRetries} retries.", MaxRetries);
                    response.EnsureSuccessStatusCode();
                }

                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1));
                _logger.LogWarning("429 rate limited. Retry {Attempt}/{Max} in {Delay}s", attempt + 1, MaxRetries, delay.TotalSeconds);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("API error {StatusCode}: {Body}", response.StatusCode, errorBody);
                response.EnsureSuccessStatusCode();
            }

            var result = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken: cancellationToken);

            var text = result?.Choices?.FirstOrDefault()?.Message?.Content
                ?? throw new InvalidOperationException("No response from API.");

            return ExtractHtml(text);
        }

        throw new InvalidOperationException("Unexpected retry loop exit.");
    }

    private static string BuildPrompt(string html, string instructions)
    {
        return $"""
            Apply the following modifications to the HTML below.

            IMPORTANT RULES:
            - Return ONLY the modified HTML, nothing else.
            - Do NOT add markdown code fences or any explanation.
            - Preserve the overall structure of the HTML.
            - Apply ALL the requested modifications.
            - If an element to remove is not found, leave the HTML unchanged for that instruction.

            INSTRUCTIONS:
            {instructions}

            HTML TO MODIFY:
            {html}
            """;
    }

    private static string ExtractHtml(string text)
    {
        var trimmed = text.Trim();

        if (trimmed.StartsWith("```html", StringComparison.OrdinalIgnoreCase))
            trimmed = trimmed[7..];
        else if (trimmed.StartsWith("```"))
            trimmed = trimmed[3..];

        if (trimmed.EndsWith("```"))
            trimmed = trimmed[..^3];

        return trimmed.Trim();
    }

    #region OpenAI-compatible DTOs

    private class ChatCompletionRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public List<Message> Messages { get; set; } = [];
    }

    private class Message
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    private class ChatCompletionResponse
    {
        [JsonPropertyName("choices")]
        public List<Choice>? Choices { get; set; }
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public Message? Message { get; set; }
    }

    #endregion
}
