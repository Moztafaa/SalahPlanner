using System;
using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PrayerTasker.Application.Services.PrayerTimeService;
using PrayerTasker.Domain.IdentityEntities;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Infrastructure.DatabaseContext;
using PrayerTasker.Infrastructure.PrayerTimeCall;
using PrayerTasker.Infrastructure.RepositoryImplementation;

namespace PrayerTasker.Infrastructure.DI;

public static class ServiceContainer
{
    public static void AddInfrastructureServices(this IServiceCollection services, WebApplicationBuilder builder)
    {

        services.AddScoped<IDailyUserPrayerTimeRepository, DailyUserPrayerTimeRepository>();

        // add infrastructure services here for identity, database, logging, etc.
        // Identity
        services.AddDbContext<AppDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        services.AddHangfire(config => config.UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
        services.AddHangfireServer();

        // Enable Identity services
        services.AddIdentity<ApplicationUser, ApplicationRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders()
            .AddUserStore<UserStore<ApplicationUser, ApplicationRole, AppDbContext, Guid>>()
            .AddRoleStore<RoleStore<ApplicationRole, AppDbContext, Guid>>();

        services.ConfigureApplicationCookie(options =>
        {
            options.LoginPath = "/Account/Login";
            options.AccessDeniedPath = "/Account/AccessDenied";
        });


        // Register HttpClient for PrayerTimeService
        services.AddHttpClient<IPrayerTimeService, PrayerTimeService>();

    }

}
