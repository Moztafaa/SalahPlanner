using Microsoft.AspNetCore.Identity;
using PrayerTasker.Domain.Entities;

namespace PrayerTasker.Domain.IdentityEntities;

// TODO: Resolve the coupling with IdentityUser in the future if needed (YAGNI "You Aren't Gonna Need It" for now) as Domain entity should be pure POCO
public class ApplicationUser : IdentityUser<Guid>
{

    public required string FullName { get; set; }
    public string? DefaultCity { get; set; }
    public string? DefaultCountry { get; set; }
    public int CalculationMethod { get; set; }
    public ICollection<Taask> Tasks { get; set; }
    public ICollection<DailyUserPrayerTime> PrayerTimeCache { get; set; }


}
