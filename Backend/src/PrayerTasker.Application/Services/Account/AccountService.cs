using System;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Domain.Entities;

namespace PrayerTasker.Application.Services.Account;

public class AccountService(
    UserManager<ApplicationUser> _userManager,
    SignInManager<ApplicationUser> _signInManager,
    IMapper _mapper,
    IJwtService _jwtService,
    IRefreshTokenRepository _refreshTokenRepository) : IAccountService
{
    // TODO: Implement Rate limiting on login attempts to prevent brute-force attacks
    public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
    {
        ApplicationUser? user = await _userManager.FindByEmailAsync(loginDto.Email) ?? throw new UnauthorizedAccessException("Invalid email or password.");
        SignInResult result = await _signInManager.PasswordSignInAsync(user.UserName!, loginDto.Password, isPersistent: false, lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        LoginResponseDto authenticationResponse = _jwtService.CreateToken(user);

        // Store refresh token in database
        var refreshToken = new RefreshToken
        {
            Token = authenticationResponse.RefreshToken,
            ApplicationUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = authenticationResponse.RefreshTokenExpiration
        };

        // Revoke any existing active tokens for this user
        await _refreshTokenRepository.RevokeAllUserTokensAsync(user.Id);

        // Add new refresh token
        await _refreshTokenRepository.AddAsync(refreshToken);

        return authenticationResponse;
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenAsync(refreshToken)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        if (!storedToken.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token is expired or revoked.");
        }

        var user = storedToken.ApplicationUser
            ?? await _userManager.FindByIdAsync(storedToken.ApplicationUserId.ToString())
            ?? throw new UnauthorizedAccessException("User not found.");

        // Generate new access token and refresh token
        LoginResponseDto newAuthResponse = _jwtService.CreateToken(user);

        // Revoke old refresh token
        storedToken.RevokedAt = DateTime.UtcNow;
        await _refreshTokenRepository.UpdateAsync(storedToken);

        // Store new refresh token
        var newRefreshToken = new RefreshToken
        {
            Token = newAuthResponse.RefreshToken,
            ApplicationUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = newAuthResponse.RefreshTokenExpiration
        };

        await _refreshTokenRepository.AddAsync(newRefreshToken);

        return newAuthResponse;
    }

    public async Task RevokeRefreshTokenAsync(string userId)
    {
        if (Guid.TryParse(userId, out Guid userGuid))
        {
            await _refreshTokenRepository.RevokeAllUserTokensAsync(userGuid);
        }
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
        user.IsAutoLocation = settings.IsAutoLocation;
        user.CalculationMethod = settings.CalculationMethod;

        return await _userManager.UpdateAsync(user);

    }

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
            IsAutoLocation = user.IsAutoLocation,
            CalculationMethod = user.CalculationMethod!
        };

        return settings;

    }
}
