using System;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.Services.Account;

public interface IJwtService
{
    LoginResponseDto CreateToken(ApplicationUser user);

}