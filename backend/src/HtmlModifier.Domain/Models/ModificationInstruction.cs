namespace HtmlModifier.Domain.Models;

public class ModificationInstruction
{
    public string Action { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string? Details { get; set; }
}
