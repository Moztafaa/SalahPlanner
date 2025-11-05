using System;

namespace PrayerTasker.Application.DTOs.Account;

public class LoginResponseDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Token { get; set; }
    public DateTime Expiration { get; set; }

}
