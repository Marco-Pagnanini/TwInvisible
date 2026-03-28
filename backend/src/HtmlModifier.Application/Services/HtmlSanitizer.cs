using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace HtmlModifier.Application.Services;

/// <summary>
/// Aggressively strips non-structural content from HTML to reduce token count.
/// Target: reduce a 1MB Amazon page to &lt;100KB of clean structural HTML.
/// </summary>
public static partial class HtmlSanitizer
{
    private static readonly HashSet<string> TagsToRemove = new(StringComparer.OrdinalIgnoreCase)
    {
        "script", "style", "svg", "noscript", "iframe", "link", "meta",
        "head", "picture", "source", "video", "audio", "canvas", "map",
        "object", "embed", "applet", "form", "input", "select", "textarea",
        "button", "label", "fieldset", "legend", "optgroup", "option",
        "template", "slot", "dialog", "details", "summary", "menu",
        "base", "col", "colgroup", "datalist", "output", "progress",
        "meter", "param", "track", "wbr"
    };

    // Only keep these structural/semantic tags; flatten everything else
    private static readonly HashSet<string> TagsToKeep = new(StringComparer.OrdinalIgnoreCase)
    {
        "html", "body", "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "a", "img", "ul", "ol", "li", "table", "tr", "td", "th", "thead", "tbody",
        "section", "article", "aside", "header", "footer", "nav", "main",
        "figure", "figcaption", "blockquote", "pre", "code",
        "b", "strong", "i", "em", "u", "br", "hr"
    };

    private static readonly HashSet<string> AttributesToKeep = new(StringComparer.OrdinalIgnoreCase)
    {
        "id", "href", "src", "alt", "title"
    };

    public static string Sanitize(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Extract just the body if present
        var body = doc.DocumentNode.SelectSingleNode("//body");
        var root = body ?? doc.DocumentNode;

        // Remove comments
        RemoveComments(root);

        // Remove unwanted tags entirely (script, style, svg, form, input, etc.)
        RemoveTagsByName(root, TagsToRemove);

        // Unwrap non-structural tags (keep content, remove wrapper)
        UnwrapNonStructuralTags(root);

        // Clean attributes — keep only id, href, src, alt, title
        CleanAttributes(root);

        // Remove empty nodes repeatedly
        RemoveEmptyNodes(root);

        var result = root.InnerHtml;

        // Collapse whitespace aggressively
        result = MultipleSpaces().Replace(result, " ");
        result = SpaceBetweenTags().Replace(result, "><");
        result = MultipleNewlines().Replace(result, "\n");

        return result.Trim();
    }

    private static void RemoveComments(HtmlNode root)
    {
        var comments = root.SelectNodes(".//comment()");
        if (comments != null)
            foreach (var c in comments) c.Remove();
    }

    private static void RemoveTagsByName(HtmlNode root, HashSet<string> tags)
    {
        foreach (var tag in tags)
        {
            var nodes = root.SelectNodes($".//{tag}");
            if (nodes == null) continue;
            foreach (var node in nodes) node.Remove();
        }
    }

    /// <summary>
    /// For tags not in TagsToKeep, replace them with their inner content (unwrap).
    /// This flattens things like &lt;span class="weird-amazon-class"&gt;text&lt;/span&gt; → text
    /// </summary>
    private static void UnwrapNonStructuralTags(HtmlNode root)
    {
        bool changed;
        do
        {
            changed = false;
            var allElements = root.SelectNodes(".//*");
            if (allElements == null) break;

            foreach (var node in allElements)
            {
                if (node.NodeType == HtmlNodeType.Element && !TagsToKeep.Contains(node.Name))
                {
                    // Replace this node with its children
                    var parent = node.ParentNode;
                    if (parent == null) continue;

                    foreach (var child in node.ChildNodes.ToList())
                    {
                        parent.InsertBefore(child, node);
                    }
                    parent.RemoveChild(node);
                    changed = true;
                    break; // restart since DOM changed
                }
            }
        } while (changed);
    }

    private static void CleanAttributes(HtmlNode root)
    {
        var allNodes = root.SelectNodes(".//*");
        if (allNodes == null) return;

        foreach (var node in allNodes)
        {
            var toRemove = node.Attributes
                .Where(a => !AttributesToKeep.Contains(a.Name))
                .Select(a => a.Name)
                .ToList();

            foreach (var attr in toRemove)
                node.Attributes.Remove(attr);

            // Remove href="javascript:..." or href="#"
            var href = node.GetAttributeValue("href", "");
            if (href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase) || href == "#")
                node.Attributes.Remove("href");

            // Remove empty src
            var src = node.GetAttributeValue("src", "");
            if (string.IsNullOrWhiteSpace(src))
                node.Attributes.Remove("src");
        }
    }

    private static void RemoveEmptyNodes(HtmlNode root)
    {
        bool changed;
        int passes = 0;
        do
        {
            changed = false;
            passes++;
            var nodes = root.SelectNodes(".//*");
            if (nodes == null) break;

            foreach (var node in nodes)
            {
                if (node.NodeType == HtmlNodeType.Element &&
                    string.IsNullOrWhiteSpace(node.InnerText) &&
                    node.Name != "img" && node.Name != "br" && node.Name != "hr")
                {
                    node.Remove();
                    changed = true;
                }
            }
        } while (changed && passes < 10);
    }

    [GeneratedRegex(@"\s{2,}")]
    private static partial Regex MultipleSpaces();

    [GeneratedRegex(@">\s+<")]
    private static partial Regex SpaceBetweenTags();

    [GeneratedRegex(@"\n{3,}")]
    private static partial Regex MultipleNewlines();
}
