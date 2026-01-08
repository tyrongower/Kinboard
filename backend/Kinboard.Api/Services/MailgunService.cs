using Kinboard.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;

namespace Kinboard.Api.Services;

public class MailgunService : IMailService
{
    private readonly HttpClient _httpClient;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<MailgunService> _logger;

    public MailgunService(HttpClient httpClient, AppDbContext dbContext, ILogger<MailgunService> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SendWelcomeEmailAsync(string email, string displayName, string siteUrl)
    {
        var subject = "Welcome to Kinboard!";
        var body = GetBaseTemplate(
            "Welcome to Kinboard",
            $"Hi {displayName},",
            $"A new account has been created for you on Kinboard. You can now log in using your email address: <strong>{email}</strong>.",
            "Your password will be provided to you verbally by the administrator.",
            "Login to Kinboard",
            siteUrl
        );

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendAdminPromotionEmailAsync(string email, string displayName, string siteUrl)
    {
        var subject = "You are now an Admin on Kinboard";
        var body = GetBaseTemplate(
            "Admin Promotion",
            $"Hi {displayName},",
            "Your account has been promoted to Administrator. You now have access to all administrative features on Kinboard.",
            "You can log in and manage the site using the link below.",
            "Go to Kinboard",
            siteUrl
        );

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        var settings = await _dbContext.SiteSettings.FirstOrDefaultAsync();
        if (settings == null || string.IsNullOrEmpty(settings.MailgunApiKey) || string.IsNullOrEmpty(settings.MailgunDomain))
        {
            _logger.LogWarning("Mailgun settings are not configured. Skipping email sending.");
            return;
        }

        var from = settings.MailgunFromEmail ?? $"Kinboard <noreply@{settings.MailgunDomain}>";
        var url = $"https://api.mailgun.net/v3/{settings.MailgunDomain}/messages";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"api:{settings.MailgunApiKey}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authToken);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("from", from),
            new KeyValuePair<string, string>("to", to),
            new KeyValuePair<string, string>("subject", subject),
            new KeyValuePair<string, string>("html", htmlBody)
        });

        request.Content = content;

        try
        {
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send email via Mailgun. Status: {StatusCode}, Error: {Error}", response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email via Mailgun");
        }
    }

    private string GetBaseTemplate(string title, string greeting, string message, string subMessage, string buttonText, string buttonUrl)
    {
        // Simple branded template matching Kinboard's modern style
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f7f9;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }}
        .header {{
            background-color: #3b82f6;
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }}
        .content {{
            padding: 40px;
        }}
        .content h2 {{
            margin-top: 0;
            color: #111;
            font-size: 20px;
        }}
        .content p {{
            margin-bottom: 20px;
            color: #4b5563;
        }}
        .button-container {{
            text-align: center;
            margin-top: 30px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }}
        .footer {{
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Kinboard</h1>
        </div>
        <div class=""content"">
            <h2>{greeting}</h2>
            <p>{message}</p>
            <p>{subMessage}</p>
            <div class=""button-container"">
                <a href=""{buttonUrl}"" class=""button"">{buttonText}</a>
            </div>
        </div>
        <div class=""footer"">
            &copy; {DateTime.Now.Year} Kinboard. All rights reserved.
        </div>
    </div>
</body>
</html>
";
    }
}
