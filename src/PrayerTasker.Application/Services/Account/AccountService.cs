using System;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.Services.Account;

public class AccountService(UserManager<ApplicationUser> _userManager,
                            SignInManager<ApplicationUser> _signInManager, IMapper _mapper) : IAccountService
{
    public async Task<SignInResult> LoginAsync(LoginDto loginDto)
    {
        ApplicationUser? user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null)
        {
            return SignInResult.Failed;
        }
        return await _signInManager.PasswordSignInAsync(user.UserName!, loginDto.Password, isPersistent: true, lockoutOnFailure: false);

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
        if (user == null)
        {
            return await Task.FromResult(false);
        }
        else
        {
            return await Task.FromResult(true);
        }

    }

    public async Task<ApplicationUser?> GetUserByEmailAsync(string email) => await _userManager.FindByEmailAsync(email);
}
