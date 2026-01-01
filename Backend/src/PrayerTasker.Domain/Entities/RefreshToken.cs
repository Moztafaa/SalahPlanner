using System.ComponentModel.DataAnnotations;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Domain.Entities;

/// <summary>
/// Represents a refresh token for JWT authentication
/// </summary>
public class RefreshToken
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(256)]
    public required string Token { get; set; }

    [Required]
    public required Guid ApplicationUserId { get; set; }

    public required DateTime CreatedAt { get; set; }

    public required DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

    public bool IsRevoked => RevokedAt != null;

    public bool IsActive => !IsExpired && !IsRevoked;

    // Navigation property
    public ApplicationUser? ApplicationUser { get; set; }
}
