namespace HtmlModifier.Application.DTOs;

public class HtmlModifyResponse
{
    public string ModifiedHtml { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Error { get; set; }
    public int OriginalSize { get; set; }
    public int SanitizedSize { get; set; }
    public List<string> SelectorsApplied { get; set; } = [];
}
