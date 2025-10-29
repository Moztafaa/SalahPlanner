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
    public async Task<DailyUserPrayerTime?> GetCachedPrayerTimeAsync(DateTime date, int method)
    {
        // TODO: Use 'method' parameter to filter cached prayer times if needed in future && Add UserId filtering
        return await _context.DailyUserPrayerTimes
            .FirstOrDefaultAsync(pt => pt.Date.Date == date.Date);
    }
}
