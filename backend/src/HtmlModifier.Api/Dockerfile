FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5062

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/HtmlModifier.Domain/HtmlModifier.Domain.csproj HtmlModifier.Domain/
COPY src/HtmlModifier.Application/HtmlModifier.Application.csproj HtmlModifier.Application/
COPY src/HtmlModifier.Infrastructure/HtmlModifier.Infrastructure.csproj HtmlModifier.Infrastructure/
COPY src/HtmlModifier.Api/HtmlModifier.Api.csproj HtmlModifier.Api/
RUN dotnet restore HtmlModifier.Api/HtmlModifier.Api.csproj

# Copy source code and build
COPY src/HtmlModifier.Domain/ HtmlModifier.Domain/
COPY src/HtmlModifier.Application/ HtmlModifier.Application/
COPY src/HtmlModifier.Infrastructure/ HtmlModifier.Infrastructure/
COPY src/HtmlModifier.Api/ HtmlModifier.Api/
RUN dotnet publish HtmlModifier.Api/HtmlModifier.Api.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5062
ENTRYPOINT ["dotnet", "HtmlModifier.Api.dll"]
