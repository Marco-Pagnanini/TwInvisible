using Microsoft.AspNetCore.Mvc;
using UserProfile.Application.DTOs;
using UserProfile.Application.Services;

namespace UserProfile.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserProfileController : ControllerBase
{
    private readonly UserProfileService _service;

    public UserProfileController(UserProfileService service)
    {
        _service = service;
    }

    /// <summary>
    /// Receives 5 answers about shopping behavior and returns a profile with percentage scores.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Analyze(
        [FromBody] UserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.AnalyzeAsync(request, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
