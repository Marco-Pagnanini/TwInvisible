using HtmlModifier.Application.Interfaces;
using HtmlModifier.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace HtmlModifier.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient<IAiHtmlModifierService, GeminiHtmlModifierService>();
        return services;
    }
}
