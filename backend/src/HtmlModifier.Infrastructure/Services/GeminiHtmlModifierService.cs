using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using HtmlModifier.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HtmlModifier.Infrastructure.Services;

public class GeminiHtmlModifierService : IAiHtmlModifierService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly ILogger<GeminiHtmlModifierService> _logger;

    private const int MaxRetries = 5;

    public GeminiHtmlModifierService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiHtmlModifierService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");
        _model = configuration["Gemini:Model"] ?? "gemini-2.0-flash";
    }

    public async Task<string> ModifyHtmlAsync(string html, string instructions, CancellationToken cancellationToken = default)
    {
        var prompt = BuildPrompt(html, instructions);

        var requestBody = new GeminiRequest
        {
            Contents = [
                new Content
                {
                    Parts = [new Part { Text = prompt }]
                }
            ]
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
            _logger.LogInformation("Calling Gemini: model={Model}, htmlSize={Size}chars", _model, requestBody.Contents[0].Parts[0].Text.Length);

        // Retry loop with exponential backoff for 429
        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            var response = await _httpClient.PostAsJsonAsync(url, requestBody, cancellationToken);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                if (attempt == MaxRetries)
                {
                    _logger.LogError("Gemini API rate limit exceeded after {MaxRetries} retries.", MaxRetries);
                    response.EnsureSuccessStatusCode(); // throws
                }

                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1)); // 2s, 4s, 8s, 16s, 32s
                _logger.LogWarning("Gemini 429 rate limited. Retry {Attempt}/{Max} in {Delay}s", attempt + 1, MaxRetries, delay.TotalSeconds);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API error {StatusCode} at {Url}: {Body}", response.StatusCode, url.Split('?')[0], errorBody);
                response.EnsureSuccessStatusCode();
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: cancellationToken);

            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text
                ?? throw new InvalidOperationException("No response from Gemini API.");

            return ExtractHtml(text);
        }

        throw new InvalidOperationException("Unexpected retry loop exit.");
    }

    private static string BuildPrompt(string structureMap, string instructions)
    {
        return $"""
            You are an HTML element selector assistant.
            You receive a STRUCTURAL MAP of an HTML page (not the full HTML) and user instructions.

            Your job: return ONLY the CSS selectors of elements to REMOVE, one per line.

            RULES:
            - Return ONLY CSS selectors, one per line
            - Use #id selectors when an id is available (e.g., #nav-bar)
            - Use tag[attribute="value"] when no id (e.g., div[role="navigation"])
            - Use simple tag names as last resort (e.g., nav, footer)
            - Do NOT add explanations, markdown, or comments
            - If nothing matches the instruction, return an empty response

            EXAMPLES of valid output:
            #carousel-container
            nav
            div[role="banner"]
            footer
            #ad-sidebar

            USER INSTRUCTIONS:
            {instructions}

            HTML STRUCTURE MAP:
            {structureMap}
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

    #region Gemini API DTOs

    private class GeminiRequest
    {
        [JsonPropertyName("contents")]
        public List<Content> Contents { get; set; } = [];
    }

    private class Content
    {
        [JsonPropertyName("parts")]
        public List<Part> Parts { get; set; } = [];
    }

    private class Part
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    private class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public List<Candidate>? Candidates { get; set; }
    }

    private class Candidate
    {
        [JsonPropertyName("content")]
        public Content? Content { get; set; }
    }

    #endregion
}
