namespace UserProfile.Application.Interfaces;

public interface IAiProfileAnalyzer
{
    Task<string> AnalyzeProfileAsync(string prompt, CancellationToken cancellationToken = default);
}
