using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Application.Services.PrayerTimeService;
using PrayerTasker.Domain.IdentityEntities;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Infrastructure.DatabaseContext;
using PrayerTasker.Infrastructure.Jwt;
using PrayerTasker.Infrastructure.PrayerTimeCall;
using PrayerTasker.Infrastructure.RepositoryImplementation;
namespace PrayerTasker.Infrastructure.DI;

public static class ServiceContainer
{
    public static void AddInfrastructureServices(this IServiceCollection services, WebApplicationBuilder builder, IConfiguration configuration)
    {

        services.AddScoped<IDailyUserPrayerTimeRepository, DailyUserPrayerTimeRepository>();
        services.AddScoped<ITaskRepository, TaskRepository>();

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

        // services.ConfigureApplicationCookie(options =>
        // {
        //     options.LoginPath = "/Account/Login";
        //     options.AccessDeniedPath = "/Account/AccessDenied";
        // });


        // Register HttpClient for PrayerTimeService (Transient by default)
        services.AddHttpClient<IPrayerTimeService, PrayerTimeService>();

        // Add jwt configuration
        IConfigurationSection jwtSettings = configuration.GetSection("Jwt");

        byte[] key = System.Text.Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                };
            });
        // jwt
        services.AddAuthorization(options =>
        {
        });
        services.AddScoped<IJwtService, JwtService>();
    }

}
