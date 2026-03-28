using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using UserProfile.Application.Interfaces;
using UserProfile.Infrastructure.Services;

namespace UserProfile.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddUserProfileInfrastructure(this IServiceCollection services)
    {
        services
            .AddHttpClient<IAiProfileAnalyzer, GeminiProfileAnalyzerService>(client =>
            {
                // HttpClient non deve mai scadere autonomamente:
                // il controllo del timeout è delegato alla resilience policy sotto.
                client.Timeout = System.Threading.Timeout.InfiniteTimeSpan;
            })
            // Sovrascrive la StandardResilienceHandler globale (30s) di Aspire
            // con timeout molto più lunghi adatti alle chiamate AI di Gemini.
            .AddStandardResilienceHandler(options =>
            {
                options.TotalRequestTimeout.Timeout    = TimeSpan.FromMinutes(5);
                options.AttemptTimeout.Timeout         = TimeSpan.FromMinutes(4);
                options.Retry.MaxRetryAttempts         = 2;
                options.Retry.Delay                    = TimeSpan.FromSeconds(3);
                options.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(2);
            });

        return services;
    }
}
