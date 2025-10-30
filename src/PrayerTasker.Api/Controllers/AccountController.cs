using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;
using System.Security.Claims;

namespace PrayerTasker.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController(IAccountService _accountService) : ControllerBase
{
    // TODO: PUT /api/auth/me/settings to update user settings like default city, country, calculation method, etc.
    [HttpPut("me/settings")]
    public async Task<IActionResult> UpdateUserSettings([FromBody] UserSettingsDto settings)
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            return Unauthorized(new { Message = "User is not authenticated" });
        }

        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { Message = "User ID not found in token" });
        }

        IdentityResult result = await _accountService.SetUserSettingsAsync(userId, settings);
        if (result.Succeeded)
        {
            return Ok(new { Message = "User settings updated successfully" });
        }
        return BadRequest(new
        {
            errors = result.Errors.Select(e => new { e.Code, e.Description })
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // validate email with remote attribute
        bool isEmailRegistered = await _accountService.IsEmailAlreadyRegistered(registerDto.Email);
        if (isEmailRegistered)
        {
            ModelState.AddModelError("Email", "Email is already in use");
            return BadRequest(ModelState);
        }
        (IdentityResult? result, ApplicationUser? user) = await _accountService.RegisterAsync(registerDto);
        if (result.Succeeded && user != null)
        {
            return StatusCode(StatusCodes.Status201Created, new RegisterResponseDto
            {
                UserId = user.Id.ToString(),
                UserName = user.UserName!,
                Email = user.Email!,
                Message = "User registered successfully"
            });
        }
        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "Registeration succeeded but user data is unavailable.");
        }
        return BadRequest(new
        {
            errors = result.Errors.Select(e => new { e.Code, e.Description })
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var signInResult = await _accountService.LoginAsync(loginDto);
        if (signInResult.Succeeded)
        {
            ApplicationUser? user = await _accountService.GetUserByEmailAsync(loginDto.Email);
            if (user != null)
            {
                return Ok(new LoginResponseDto
                {
                    UserId = user.Id.ToString(),
                    UserName = user.UserName!,
                    Email = user.Email!,
                    FullName = user.FullName!,
                    Message = "Login successful"
                });
            }
            return StatusCode(StatusCodes.Status500InternalServerError, "Login succeeded but user data is unavailable.");
        }
        return Unauthorized(new { Message = "Invalid email or password" });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _accountService.LogoutAsync();
        return Ok(new { Message = "Logout successful" });
    }

}
