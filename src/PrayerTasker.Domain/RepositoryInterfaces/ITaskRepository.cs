using System;
using PrayerTasker.Domain.Entities;

namespace PrayerTasker.Domain.RepositoryInterface;

public interface ITaskRepository
{
    Task<Taask?> GetByIdForUserAsync(Guid id, string userId);
    Task<List<Taask>> GetByDateForUserAsync(DateTime date, string userId);

    Task AddAsync(Taask task);
    Task UpdateAsync(Taask task);
    Task DeleteAsync(Taask task);
}
