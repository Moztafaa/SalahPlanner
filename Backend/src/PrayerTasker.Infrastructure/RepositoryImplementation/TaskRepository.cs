using System;
using Microsoft.EntityFrameworkCore;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Infrastructure.DatabaseContext;

namespace PrayerTasker.Infrastructure.RepositoryImplementation;

public class TaskRepository(AppDbContext _context) : ITaskRepository
{
    public async Task AddAsync(Taask task)
    {
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

    }
    public async Task DeleteAsync(Taask task)
    {
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
    }
    public async Task<List<Taask>> GetByDateForUserAsync(DateTime date, string userId)
    {
        return await _context.Tasks
            .Where(t => t.ApplicationUserId.ToString() == userId
                        && t.TaskDate.HasValue
                        && t.TaskDate.Value.Date == date.Date)
            .ToListAsync();
    }
    public Task<Taask?> GetByIdForUserAsync(Guid id, string userId)
    {
        return _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ApplicationUserId.ToString() == userId);
    }
    public async Task UpdateAsync(Taask task)
    {
        _context.Tasks.Update(task);
        await _context.SaveChangesAsync();
    }
}
