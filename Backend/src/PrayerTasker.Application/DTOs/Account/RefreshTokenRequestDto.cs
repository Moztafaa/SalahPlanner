using System.ComponentModel.DataAnnotations;

namespace PrayerTasker.Application.DTOs.Account;

public class RefreshTokenRequestDto
{
    [Required(ErrorMessage = "Refresh token is required.")]
    public required string RefreshToken { get; set; }
}
