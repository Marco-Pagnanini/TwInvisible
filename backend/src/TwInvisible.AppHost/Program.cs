var builder = DistributedApplication.CreateBuilder(args);

var geminiApiKey = builder.AddParameter("gemini-api-key", secret: true);
var geminiModel = builder.AddParameter("gemini-model");

var htmlModifier = builder.AddProject<Projects.HtmlModifier_Api>("htmlmodifier-api")
    .WithEnvironment("Gemini__ApiKey", geminiApiKey)
    .WithEnvironment("Gemini__Model", geminiModel)
    .WithHttpEndpoint(port: 5062, name: "http");

var userProfile = builder.AddProject<Projects.UserProfile_Api>("userprofile-api")
    .WithEnvironment("Gemini__ApiKey", geminiApiKey)
    .WithEnvironment("Gemini__Model", geminiModel)
    .WithHttpEndpoint(port: 5063, name: "http");

builder.Build().Run();
