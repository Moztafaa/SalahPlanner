using Hangfire;
using PrayerTasker.Api.DI;
using PrayerTasker.Application.DI;
using PrayerTasker.Infrastructure.DI;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDomainServices();
builder.Services.AddInfrastructureServices(builder);
builder.Services.AddApplicationServices();

// TODO: Fix Maghrib is empty in Prayer Times response


WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard();
app.MapControllers();
await app.RunAsync();
