using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UserProfile.Application.Interfaces;

namespace UserProfile.Infrastructure.Services;

public class GeminiProfileAnalyzerService : IAiProfileAnalyzer
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly ILogger<GeminiProfileAnalyzerService> _logger;

    private const int MaxRetries = 5;

    public GeminiProfileAnalyzerService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiProfileAnalyzerService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");
        _model = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
    }

    public async Task<string> AnalyzeProfileAsync(string prompt, CancellationToken cancellationToken = default)
    {
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
        _logger.LogInformation("Calling Gemini for profile analysis: model={Model}", _model);

        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            var response = await _httpClient.PostAsJsonAsync(url, requestBody, cancellationToken);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                if (attempt == MaxRetries)
                {
                    _logger.LogError("Gemini API rate limit exceeded after {MaxRetries} retries.", MaxRetries);
                    response.EnsureSuccessStatusCode();
                }

                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1));
                _logger.LogWarning("Gemini 429 rate limited. Retry {Attempt}/{Max} in {Delay}s", attempt + 1, MaxRetries, delay.TotalSeconds);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API error {StatusCode}: {Body}", response.StatusCode, errorBody);
                response.EnsureSuccessStatusCode();
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: cancellationToken);

            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text
                ?? throw new InvalidOperationException("No response from Gemini API.");

            _logger.LogInformation("Gemini profile analysis completed successfully.");
            return text;
        }

        throw new InvalidOperationException("Unexpected retry loop exit.");
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
