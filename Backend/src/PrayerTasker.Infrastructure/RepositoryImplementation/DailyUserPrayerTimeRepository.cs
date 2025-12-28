using System;
using Microsoft.EntityFrameworkCore;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Infrastructure.DatabaseContext;

namespace PrayerTasker.Infrastructure.RepositoryImplementation;

public class DailyUserPrayerTimeRepository(AppDbContext _context) : IDailyUserPrayerTimeRepository
{

    public async Task AddPrayerTimeAsync(DailyUserPrayerTime prayerTime)
    {
        await _context.DailyUserPrayerTimes.AddAsync(prayerTime);
        await _context.SaveChangesAsync();
    }

    // TODO: User Redis or In-Memory caching for better performance
    public async Task<DailyUserPrayerTime?> GetCachedPrayerTimeAsync(
        DateTime date,
        int method,
        string? userId = null,
        string? city = null,
        string? country = null,
        double? latitude = null,
        double? longitude = null)
    {
        // If coordinates are provided, match by coordinates (with small tolerance)
        if (latitude.HasValue && longitude.HasValue)
        {
            const double tolerance = 0.01; // ~1km tolerance
            return await _context.DailyUserPrayerTimes
                .FirstOrDefaultAsync(pt => pt.Date.Date == date.Date
                    && pt.ApplicationUserId.ToString() == userId
                    && pt.Method == method
                    && pt.Latitude.HasValue && pt.Longitude.HasValue
                    && Math.Abs(pt.Latitude.Value - latitude.Value) < tolerance
                    && Math.Abs(pt.Longitude.Value - longitude.Value) < tolerance);
        }

        // Otherwise match by city and country
        return await _context.DailyUserPrayerTimes
            .FirstOrDefaultAsync(pt => pt.Date.Date == date.Date
                && pt.ApplicationUserId.ToString() == userId
                && pt.Method == method
                && pt.City != null && pt.City.ToLower() == (city ?? "").ToLower()
                && pt.Country != null && pt.Country.ToLower() == (country ?? "").ToLower());
    }
}
