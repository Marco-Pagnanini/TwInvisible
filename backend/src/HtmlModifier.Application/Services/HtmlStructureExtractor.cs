using System.Text;
using HtmlAgilityPack;

namespace HtmlModifier.Application.Services;

/// <summary>
/// Extracts a lightweight structural map of the HTML.
/// Instead of sending 68KB+ of HTML to the AI, we send a ~2-3KB "skeleton"
/// with tag names, IDs, roles, and text previews.
/// The AI then returns CSS selectors for elements to modify.
/// </summary>
public static class HtmlStructureExtractor
{
    private static readonly HashSet<string> SkipTags = new(StringComparer.OrdinalIgnoreCase)
    {
        "script", "style", "svg", "noscript", "iframe", "link", "meta",
        "head", "picture", "source", "video", "audio", "canvas", "br", "hr",
        "input", "select", "textarea", "button", "option", "template"
    };

    public static string ExtractStructure(string html, int maxDepth = 6)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var body = doc.DocumentNode.SelectSingleNode("//body") ?? doc.DocumentNode;
        var sb = new StringBuilder();

        BuildStructure(body, sb, depth: 0, maxDepth: maxDepth);

        return sb.ToString();
    }

    private static void BuildStructure(HtmlNode node, StringBuilder sb, int depth, int maxDepth)
    {
        if (depth > maxDepth) return;

        foreach (var child in node.ChildNodes)
        {
            if (child.NodeType != HtmlNodeType.Element) continue;
            if (SkipTags.Contains(child.Name)) continue;

            var indent = new string(' ', depth * 2);
            var id = child.GetAttributeValue("id", "");
            var role = child.GetAttributeValue("role", "");
            var ariaLabel = child.GetAttributeValue("aria-label", "");
            var alt = child.GetAttributeValue("alt", "");

            // Get a short text preview (first 50 chars of direct text content)
            var textPreview = GetDirectText(child);

            sb.Append($"{indent}<{child.Name}");

            if (!string.IsNullOrEmpty(id)) sb.Append($" id=\"{id}\"");
            if (!string.IsNullOrEmpty(role)) sb.Append($" role=\"{role}\"");
            if (!string.IsNullOrEmpty(ariaLabel)) sb.Append($" aria-label=\"{ariaLabel}\"");
            if (!string.IsNullOrEmpty(alt)) sb.Append($" alt=\"{alt}\"");

            if (child.Name == "a")
            {
                var href = child.GetAttributeValue("href", "");
                if (!string.IsNullOrEmpty(href) && !href.StartsWith("javascript"))
                    sb.Append($" href=\"{Truncate(href, 60)}\"");
            }

            if (child.Name == "img")
            {
                var src = child.GetAttributeValue("src", "");
                if (!string.IsNullOrEmpty(src))
                    sb.Append($" src=\"{Truncate(src, 60)}\"");
            }

            sb.Append('>');

            if (!string.IsNullOrEmpty(textPreview))
                sb.Append($" \"{textPreview}\"");

            var childElementCount = child.ChildNodes.Count(c => c.NodeType == HtmlNodeType.Element && !SkipTags.Contains(c.Name));
            if (childElementCount > 0)
                sb.Append($" [{childElementCount} children]");

            sb.AppendLine();

            // Recurse into children
            BuildStructure(child, sb, depth + 1, maxDepth);
        }
    }

    private static string GetDirectText(HtmlNode node)
    {
        // Get only direct text nodes (not from children)
        var text = string.Join(" ", node.ChildNodes
            .Where(n => n.NodeType == HtmlNodeType.Text)
            .Select(n => n.InnerText.Trim())
            .Where(t => !string.IsNullOrEmpty(t)));

        return Truncate(text, 50);
    }

    private static string Truncate(string text, int maxLen)
    {
        if (string.IsNullOrEmpty(text)) return "";
        text = text.Trim();
        return text.Length <= maxLen ? text : text[..maxLen] + "...";
    }
}
