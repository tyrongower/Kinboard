using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Scalar.AspNetCore;
using System;
using System.Data;
using System.Data.Common;
using Serilog;

// Configure Serilog from appsettings.json
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .AddEnvironmentVariables()
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting Kinboard API");

var builder = WebApplication.CreateBuilder(args);

// Use Serilog for logging, reading configuration from appsettings.json
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<Kinboard.Api.Services.ICalendarService, Kinboard.Api.Services.CalendarService>();

// Configure SQLite database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=kinboard.db"));

// Configure CORS: permissive in Development, strict & configurable otherwise
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            if (allowedOrigins.Length > 0)
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            }
            else
            {
                // No configured origins in non-development: do not allow cross-origin requests
                // (intentionally leave origins unspecified)
                policy.AllowAnyHeader()
                      .AllowAnyMethod();
            }
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// Apply migrations on startup
Log.Information("Initializing database and applying migrations");
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Checking database connection...");


        logger.LogInformation("Applying pending migrations...");
        await db.Database.MigrateAsync();
        logger.LogInformation("All pending migrations applied successfully");

        // Get applied migrations
        var appliedMigrations = await db.Database.GetAppliedMigrationsAsync();
        var appliedMigrationsList = appliedMigrations.ToList();
        logger.LogInformation("Total applied migrations: {Count}", appliedMigrationsList.Count);

        if (appliedMigrationsList.Any())
        {
            logger.LogDebug("Applied migrations: {Migrations}", string.Join(", ", appliedMigrationsList));
        }

        logger.LogInformation("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "An error occurred while creating/migrating the database. Application startup failed.");
        throw;
    }
}

    Log.Information("Kinboard API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
