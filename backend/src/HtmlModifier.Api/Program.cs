using HtmlModifier.Application.Services;
using HtmlModifier.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Aspire ServiceDefaults (health checks, telemetry, resilience)
builder.AddServiceDefaults();

// Listen on all network interfaces (accessible from other computers)
builder.WebHost.UseUrls("http://0.0.0.0:5062");

// Allow large HTML payloads (10 MB)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10_000_000;
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Application services
builder.Services.AddScoped<HtmlModifierService>();

// Infrastructure (Gemini HTTP client)
builder.Services.AddInfrastructure();

// CORS - allow frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapDefaultEndpoints();
app.UseCors();
app.MapControllers();

app.Run();
