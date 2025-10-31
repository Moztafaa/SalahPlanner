using System;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.Services.Account;

public class AccountService(UserManager<ApplicationUser> _userManager,
                            SignInManager<ApplicationUser> _signInManager, IMapper _mapper) : IAccountService
{
    // TODO: Implement Rate limiting on login attempts to prevent brute-force attacks
    public async Task<SignInResult> LoginAsync(LoginDto loginDto)
    {
        ApplicationUser? user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null)
        {
            return SignInResult.Failed;
        }
        return await _signInManager.PasswordSignInAsync(user.UserName!, loginDto.Password, isPersistent: false, lockoutOnFailure: false);

    }
    public async Task LogoutAsync() => await _signInManager.SignOutAsync();
    public async Task<(IdentityResult Result, ApplicationUser User)> RegisterAsync(RegisterDto registerDto)
    {
        // map register dto to application user
        ApplicationUser user = _mapper.Map<ApplicationUser>(registerDto);
        IdentityResult result = await _userManager.CreateAsync(user, registerDto.Password);
        return (result, user);
    }
    public async Task<bool> IsEmailAlreadyRegistered(string email)
    {
        ApplicationUser? user = await _userManager.FindByEmailAsync(email);
        return user is not null;

    }

    public async Task<ApplicationUser?> GetUserByEmailAsync(string email) => await _userManager.FindByEmailAsync(email);
    public async Task<IdentityResult> SetUserSettingsAsync(string userId, UserSettingsDto settings)
    {
        ApplicationUser? user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError
            {
                Code = "UserNotFound",
                Description = "User not found."
            });
        }

        // update user settings
        user.DefaultCity = settings.DefaultCity;
        user.DefaultCountry = settings.DefaultCountry;
        user.CalculationMethod = settings.CalculationMethod;

        return await _userManager.UpdateAsync(user);

    }

    // Update user settings
    

    public async Task<UserSettingsDto?> GetUserSettingsAsync(string userId)
    {
        ApplicationUser? user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        // map user settings to dto
        var settings = new UserSettingsDto
        {
            DefaultCity = user.DefaultCity!,
            DefaultCountry = user.DefaultCountry!,
            CalculationMethod = user.CalculationMethod!
        };

        return settings;

    }
}
