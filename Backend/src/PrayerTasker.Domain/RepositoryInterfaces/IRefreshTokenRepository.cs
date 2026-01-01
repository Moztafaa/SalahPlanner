using PrayerTasker.Domain.Entities;

namespace PrayerTasker.Domain.RepositoryInterfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task<RefreshToken?> GetActiveByUserIdAsync(Guid userId);
    Task AddAsync(RefreshToken refreshToken);
    Task UpdateAsync(RefreshToken refreshToken);
    Task RevokeAllUserTokensAsync(Guid userId);
    Task DeleteExpiredTokensAsync();
}
