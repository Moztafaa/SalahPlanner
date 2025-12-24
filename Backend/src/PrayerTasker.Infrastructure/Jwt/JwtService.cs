using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Infrastructure.Jwt;

public class JwtService(IConfiguration configuration) : IJwtService
{
    public LoginResponseDto CreateToken(ApplicationUser user)
    {

        IConfigurationSection jwtSettings = configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

        DateTime expiration = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["EXPIRATION_MINUTES"]!));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        Claim[] claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        JwtSecurityToken token = new(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );
        var tokenHandler = new JwtSecurityTokenHandler();
        string tokenString = tokenHandler.WriteToken(token);
        return new LoginResponseDto
        {
            
            Token = tokenString,
            Expiration = expiration
        };
    }
}
