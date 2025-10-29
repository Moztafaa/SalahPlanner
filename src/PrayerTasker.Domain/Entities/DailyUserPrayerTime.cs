using System;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Domain.Entities;

public class DailyUserPrayerTime
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string? Fajr { get; set; }
    public string? Shurooq { get; set; }
    public string? Dhuhr { get; set; }
    public string? Asr { get; set; }
    public string? Maghrib { get; set; }
    public string? Isha { get; set; }
    public Guid? ApplicationUserId { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }
}
