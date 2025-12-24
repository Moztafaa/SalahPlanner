using System;
using PrayerTasker.Domain.Entities;

namespace PrayerTasker.Domain.RepositoryInterfaces;

public interface IDailyUserPrayerTimeRepository
{
    // Define methods for accessing DailyUserPrayerTime entities to be cached and checked by PrayerTimeService
    Task<DailyUserPrayerTime?> GetCachedPrayerTimeAsync(DateTime date, int method,string? userId = null);
    Task AddPrayerTimeAsync(DailyUserPrayerTime prayerTime);


}
