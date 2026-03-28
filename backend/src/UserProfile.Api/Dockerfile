FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5063

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/UserProfile.Domain/UserProfile.Domain.csproj UserProfile.Domain/
COPY src/UserProfile.Application/UserProfile.Application.csproj UserProfile.Application/
COPY src/UserProfile.Infrastructure/UserProfile.Infrastructure.csproj UserProfile.Infrastructure/
COPY src/UserProfile.Api/UserProfile.Api.csproj UserProfile.Api/
RUN dotnet restore UserProfile.Api/UserProfile.Api.csproj

# Copy source code and build
COPY src/UserProfile.Domain/ UserProfile.Domain/
COPY src/UserProfile.Application/ UserProfile.Application/
COPY src/UserProfile.Infrastructure/ UserProfile.Infrastructure/
COPY src/UserProfile.Api/ UserProfile.Api/
RUN dotnet publish UserProfile.Api/UserProfile.Api.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5063
ENTRYPOINT ["dotnet", "UserProfile.Api.dll"]
