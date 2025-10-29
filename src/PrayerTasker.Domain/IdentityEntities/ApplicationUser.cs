using Microsoft.AspNetCore.Identity;
using PrayerTasker.Domain.Entities;

namespace PrayerTasker.Domain.IdentityEntities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string? DefaultCity { get; set; }
    public string? DefaultCountry { get; set; }
    public int CalculationMethod { get; set; }
    public ICollection<Taask> Tasks { get; set; }
    public ICollection<DailyUserPrayerTime> PrayerTimeCache { get; set; }


}
