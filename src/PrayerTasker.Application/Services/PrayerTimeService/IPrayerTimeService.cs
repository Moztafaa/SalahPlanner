using System;
using PrayerTasker.Application.DTOs.PrayerTime;

namespace PrayerTasker.Application.Services.PrayerTimeService;

public interface IPrayerTimeService
{
    Task<PrayerTimesDto> GetPrayerTimesAsync(string city, string country, int method, DateTime date, string? userId = null);
}
