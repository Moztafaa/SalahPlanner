using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Infrastructure.DatabaseContext;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {

    }
    public DbSet<Taask> Tasks { get; set; }
    public DbSet<DailyUserPrayerTime> DailyUserPrayerTimes { get; set; }
    

}
