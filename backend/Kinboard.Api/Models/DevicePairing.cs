namespace Kinboard.Api.Models;

/// <summary>
/// Represents an in-progress device pairing session (OAuth device-flow style).
/// A TV/kiosk device starts a pairing, displays a QR code containing the
/// <see cref="UserCode"/>, and polls using its secret <see cref="DeviceCode"/>.
/// An admin scans the QR on their phone and approves, which mints a
/// <see cref="KioskToken"/> the device receives on its next poll.
/// </summary>
public class DevicePairing
{
    public int Id { get; set; }

    // High-entropy secret known only to the device that started pairing.
    // Used by the device to poll for approval. NEVER displayed or put in the QR.
    public string DeviceCode { get; set; } = string.Empty;

    // Short(er) random code embedded in the QR URL the phone opens.
    // Identifies the pairing; the security gate is admin auth on approve.
    public string UserCode { get; set; } = string.Empty;

    // pending -> approved (admin approved, kiosk token minted) -> consumed (device collected token)
    // or expired.
    public string Status { get; set; } = DevicePairingStatus.Pending;

    // The kiosk token minted on approval (null until approved).
    public int? KioskTokenId { get; set; }

    public DateTime CreatedAt { get; set; }

    // After this time a still-pending pairing is no longer valid.
    public DateTime ExpiresAt { get; set; }

    public DateTime? ApprovedAt { get; set; }
}

public static class DevicePairingStatus
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Consumed = "consumed";
    public const string Expired = "expired";
}
