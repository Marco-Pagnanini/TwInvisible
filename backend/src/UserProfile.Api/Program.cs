using UserProfile.Application.Services;
using UserProfile.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Aspire ServiceDefaults (health checks, telemetry, resilience)
builder.AddServiceDefaults();

builder.WebHost.UseUrls("http://0.0.0.0:5063");

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<UserProfileService>();
builder.Services.AddUserProfileInfrastructure();

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
