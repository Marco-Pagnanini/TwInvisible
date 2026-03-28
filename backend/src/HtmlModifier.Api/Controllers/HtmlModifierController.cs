using HtmlModifier.Application.DTOs;
using HtmlModifier.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HtmlModifier.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HtmlModifierController : ControllerBase
{
    private readonly HtmlModifierService _service;

    public HtmlModifierController(HtmlModifierService service)
    {
        _service = service;
    }

    /// <summary>
    /// Accepts HTML + instructions via multipart/form-data (text fields).
    /// Returns JSON with modifiedHtml, selectors, sizes.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Modify(
        [FromForm] string html,
        [FromForm] string instructions,
        CancellationToken cancellationToken)
    {
        var request = new HtmlModifyRequest { Html = html, Instructions = instructions };
        var result = await _service.ModifyAsync(request, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Accepts HTML + instructions via JSON body.
    /// Used by Chrome extension background service worker.
    /// </summary>
    [HttpPost("json")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> ModifyFromJson(
        [FromBody] HtmlModifyRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.ModifyAsync(request, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Accepts HTML as file upload + instructions.
    /// Returns JSON response.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> ModifyFromFile(
        IFormFile htmlFile,
        [FromForm] string instructions,
        CancellationToken cancellationToken)
    {
        if (htmlFile == null || htmlFile.Length == 0)
            return BadRequest(new { success = false, error = "HTML file is required." });

        using var reader = new StreamReader(htmlFile.OpenReadStream());
        var html = await reader.ReadToEndAsync(cancellationToken);

        var request = new HtmlModifyRequest { Html = html, Instructions = instructions };
        var result = await _service.ModifyAsync(request, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Same as /upload but returns the modified HTML directly as text/html.
    /// Save the response as .html file — no JSON escaping issues.
    /// Postman: Send → Save Response → Save to a file → result.html
    /// </summary>
    [HttpPost("upload/html")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> ModifyFromFileAsHtml(
        IFormFile htmlFile,
        [FromForm] string instructions,
        CancellationToken cancellationToken)
    {
        if (htmlFile == null || htmlFile.Length == 0)
            return BadRequest("HTML file is required.");

        using var reader = new StreamReader(htmlFile.OpenReadStream());
        var html = await reader.ReadToEndAsync(cancellationToken);

        var request = new HtmlModifyRequest { Html = html, Instructions = instructions };
        var result = await _service.ModifyAsync(request, cancellationToken);

        if (!result.Success)
            return BadRequest(result.Error);

        // Return raw HTML — no JSON wrapping
        return Content(result.ModifiedHtml, "text/html");
    }
}
