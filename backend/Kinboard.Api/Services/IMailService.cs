namespace Kinboard.Api.Services;

public interface IMailService
{
    Task SendWelcomeEmailAsync(string email, string displayName, string siteUrl);
    Task SendAdminPromotionEmailAsync(string email, string displayName, string siteUrl);
}
