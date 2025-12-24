using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Application.Services.TasksUserCase;

namespace PrayerTasker.Application.DI;

public static class ServiceContainer
{
    public static void AddApplicationServices(this IServiceCollection services)
    {
        // services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        services.AddAutoMapper(Assembly.GetExecutingAssembly());
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ITaskService, TaskService>();
    }
}
