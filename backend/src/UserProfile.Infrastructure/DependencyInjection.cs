using Microsoft.Extensions.DependencyInjection;
using UserProfile.Application.Interfaces;
using UserProfile.Infrastructure.Services;

namespace UserProfile.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddUserProfileInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient<IAiProfileAnalyzer, GeminiProfileAnalyzerService>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(5);
        });

        return services;
    }
}
