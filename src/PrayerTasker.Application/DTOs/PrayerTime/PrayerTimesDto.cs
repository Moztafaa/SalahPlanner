using System;

namespace PrayerTasker.Application.DTOs.PrayerTime;

public class PrayerTimesDto
{
    public DateTime? Date { get; set; }
    public string Fajr { get; set; } = string.Empty;
    public string Sunrise { get; set; } = string.Empty;
    public string Dhuhr { get; set; } = string.Empty;
    public string Asr { get; set; } = string.Empty;
    public string Maghrib { get; set; } = string.Empty;
    public string Isha { get; set; } = string.Empty;
}
