using System;

namespace PrayerTasker.Application.DTOs.Account;

public class UserSettingsDto
{
    public string DefaultCity { get; set; } = string.Empty;
    public string DefaultCountry { get; set; } = string.Empty;
    public int CalculationMethod { get; set; }

}
