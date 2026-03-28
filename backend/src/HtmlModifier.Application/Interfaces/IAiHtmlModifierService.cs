namespace HtmlModifier.Application.Interfaces;

public interface IAiHtmlModifierService
{
    Task<string> ModifyHtmlAsync(string html, string instructions, CancellationToken cancellationToken = default);
}
