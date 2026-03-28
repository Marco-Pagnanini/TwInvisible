using HtmlAgilityPack;
using HtmlModifier.Application.DTOs;
using HtmlModifier.Application.Interfaces;

namespace HtmlModifier.Application.Services;

public class HtmlModifierService
{
    private readonly IAiHtmlModifierService _aiService;

    public HtmlModifierService(IAiHtmlModifierService aiService)
    {
        _aiService = aiService;
    }

    public async Task<HtmlModifyResponse> ModifyAsync(HtmlModifyRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Html))
            return new HtmlModifyResponse { Success = false, Error = "HTML content is required." };

        if (string.IsNullOrWhiteSpace(request.Instructions))
            return new HtmlModifyResponse { Success = false, Error = "Instructions are required." };

        var originalSize = request.Html.Length;

        try
        {
            // STEP 1: Extract lightweight structural map (~2-3KB instead of 68KB+)
            var structureMap = HtmlStructureExtractor.ExtractStructure(request.Html);

            // STEP 2: Ask AI to return CSS selectors to remove/modify
            var aiResponse = await _aiService.ModifyHtmlAsync(structureMap, request.Instructions, cancellationToken);

            // STEP 3: Parse selectors and apply to ORIGINAL HTML
            var (modifiedHtml, appliedSelectors) = ApplySelectors(request.Html, aiResponse);

            return new HtmlModifyResponse
            {
                ModifiedHtml = modifiedHtml,
                Success = true,
                OriginalSize = originalSize,
                SanitizedSize = structureMap.Length,
                SelectorsApplied = appliedSelectors
            };
        }
        catch (Exception ex)
        {
            return new HtmlModifyResponse
            {
                Success = false,
                Error = $"AI processing failed: {ex.Message}",
                OriginalSize = originalSize
            };
        }
    }

    /// <summary>
    /// Parse the AI response (one CSS selector per line) and remove matching elements.
    /// Returns the modified HTML and the list of selectors that were actually applied.
    /// </summary>
    private static (string html, List<string> applied) ApplySelectors(string html, string aiResponse)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Parse selectors from AI response (one per line)
        var lines = aiResponse
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim().TrimStart('-', '*', '•').Trim())
            .Where(l => !string.IsNullOrWhiteSpace(l) && !l.StartsWith("//"))
            .ToList();

        var applied = new List<string>();

        foreach (var selector in lines)
        {
            try
            {
                var xpath = CssToXpath(selector);
                var nodes = doc.DocumentNode.SelectNodes(xpath);
                if (nodes == null || nodes.Count == 0) continue;

                foreach (var node in nodes)
                    node.Remove();

                applied.Add(selector);
            }
            catch
            {
                // Skip invalid selectors
            }
        }

        return (doc.DocumentNode.OuterHtml, applied);
    }

    /// <summary>
    /// Simple CSS selector to XPath converter.
    /// Supports: #id, tag#id, tag[attr="value"], tag
    /// </summary>
    private static string CssToXpath(string selector)
    {
        selector = selector.Trim();

        // #myId or tag#myId
        if (selector.Contains('#'))
        {
            var parts = selector.Split('#', 2);
            var tag = string.IsNullOrEmpty(parts[0]) ? "*" : parts[0];
            var id = parts[1].Split([' ', '.', '['], StringSplitOptions.None)[0];
            return $"//{tag}[@id='{id}']";
        }

        // [role="navigation"] or div[role="banner"]
        if (selector.Contains('[') && selector.Contains('='))
        {
            var bracketStart = selector.IndexOf('[');
            var tag = bracketStart > 0 ? selector[..bracketStart] : "*";
            var attr = selector[(bracketStart + 1)..selector.IndexOf(']')];
            var eqIndex = attr.IndexOf('=');
            var attrName = attr[..eqIndex];
            var attrValue = attr[(eqIndex + 1)..].Trim('\'', '"');
            return $"//{tag}[@{attrName}='{attrValue}']";
        }

        // Simple tag name (e.g., "nav", "footer", "header")
        if (selector.All(c => char.IsLetterOrDigit(c) || c == '-'))
        {
            return $"//{selector}";
        }

        // Fallback: try as-is XPath
        return selector.StartsWith("//") ? selector : $"//{selector}";
    }
}
