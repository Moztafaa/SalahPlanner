using System;
using Microsoft.AspNetCore.Identity;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.Services.Account;

public interface IAccountService
{
    Task<(IdentityResult Result, ApplicationUser User)> RegisterAsync(RegisterDto registerDto);
    Task<SignInResult> LoginAsync(LoginDto loginDto);



    Task LogoutAsync();
    Task<bool> IsEmailAlreadyRegistered(string email);
    Task<ApplicationUser?> GetUserByEmailAsync(string email);
}
