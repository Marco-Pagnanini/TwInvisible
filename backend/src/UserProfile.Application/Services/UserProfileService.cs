using System.Text.Json;
using UserProfile.Application.DTOs;
using UserProfile.Application.Interfaces;

namespace UserProfile.Application.Services;

public class UserProfileService
{
    private readonly IAiProfileAnalyzer _aiService;

    public UserProfileService(IAiProfileAnalyzer aiService)
    {
        _aiService = aiService;
    }

    public async Task<UserProfileResponse> AnalyzeAsync(UserProfileRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var prompt = BuildPrompt(request);
            var aiResponse = await _aiService.AnalyzeProfileAsync(prompt, cancellationToken);
            return ParseResponse(aiResponse);
        }
        catch (Exception ex)
        {
            return new UserProfileResponse
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    private static string BuildPrompt(UserProfileRequest request)
    {
        return $$"""
            Sei un analista comportamentale specializzato in abitudini di acquisto online.
            Ti vengono fornite 5 domande con le rispettive risposte di un utente.
            Analizza le risposte e restituisci SOLO un JSON con 5 punteggi percentuali (0-100).

            Le domande e risposte dell'utente:

            1. "Scegli un prodotto specifico o generico? Scorri nell'app?"
               Risposta: {{request.Answer1}}

            2. "Ti fai prendere dalle promo facilmente?"
               Risposta: {{request.Answer2}}

            3. "Quanto tempo passi sugli shop e quante volte entri al giorno?"
               Risposta: {{request.Answer3}}

            4. "Ti fai influenzare dalla UI (interfaccia grafica, design, layout)?"
               Risposta: {{request.Answer4}}

            5. "Valuti l'opzione di vedere siti diversi per trovare offerte migliori?"
               Risposta: {{request.Answer5}}

            Restituisci SOLO un oggetto JSON valido con questi campi (valori da 0 a 100):
            - "ci": consumo impulsivo - quanto l'utente compra d'impulso senza pensarci
            - "urg": urgenza - quanto l'utente sente urgenza nel prendere decisioni d'acquisto
            - "hobby": hobby - quanto le scelte d'acquisto sono guidate da passioni/hobby
            - "hype": hype - quanto l'utente è influenzabile da trend, UI, marketing
            - "disp_e": disposizione all'esplorazione - quanto l'utente è disposto a cercare alternative e confrontare prezzi

            RISPONDI SOLO CON IL JSON, nessun testo aggiuntivo. Esempio:
            {"ci": 75, "urg": 60, "hobby": 40, "hype": 80, "disp_e": 30}
            """;
    }

    private static UserProfileResponse ParseResponse(string aiResponse)
    {
        // Strip markdown code blocks if present
        var json = aiResponse.Trim();
        if (json.StartsWith("```"))
        {
            var startIdx = json.IndexOf('{');
            var endIdx = json.LastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx)
                json = json[startIdx..(endIdx + 1)];
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = JsonSerializer.Deserialize<JsonScores>(json, options)
            ?? throw new Exception("Failed to parse AI response as JSON");

        return new UserProfileResponse
        {
            Ci = Math.Clamp(scores.Ci, 0, 100),
            Urg = Math.Clamp(scores.Urg, 0, 100),
            Hobby = Math.Clamp(scores.Hobby, 0, 100),
            Hype = Math.Clamp(scores.Hype, 0, 100),
            DispE = Math.Clamp(scores.Disp_e ?? scores.DispE, 0, 100),
            Success = true
        };
    }

    private class JsonScores
    {
        public double Ci { get; set; }
        public double Urg { get; set; }
        public double Hobby { get; set; }
        public double Hype { get; set; }
        public double DispE { get; set; }
        public double? Disp_e { get; set; }
    }
}
