using Microsoft.EntityFrameworkCore;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Infrastructure.DatabaseContext;

namespace PrayerTasker.Infrastructure.RepositoryImplementation;

public class RefreshTokenRepository(AppDbContext context) : IRefreshTokenRepository
{
    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await context.RefreshTokens
            .Include(rt => rt.ApplicationUser)
            .FirstOrDefaultAsync(rt => rt.Token == token);
    }

    public async Task<RefreshToken?> GetActiveByUserIdAsync(Guid userId)
    {
        return await context.RefreshTokens
            .Where(rt => rt.ApplicationUserId == userId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(rt => rt.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task AddAsync(RefreshToken refreshToken)
    {
        await context.RefreshTokens.AddAsync(refreshToken);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(RefreshToken refreshToken)
    {
        context.RefreshTokens.Update(refreshToken);
        await context.SaveChangesAsync();
    }

    public async Task RevokeAllUserTokensAsync(Guid userId)
    {
        var tokens = await context.RefreshTokens
            .Where(rt => rt.ApplicationUserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();
    }

    public async Task DeleteExpiredTokensAsync()
    {
        var expiredTokens = await context.RefreshTokens
            .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        context.RefreshTokens.RemoveRange(expiredTokens);
        await context.SaveChangesAsync();
    }
}
