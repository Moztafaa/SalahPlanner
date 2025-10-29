using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController(IAccountService _accountService) : ControllerBase
{
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

}
