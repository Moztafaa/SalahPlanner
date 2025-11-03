using Hangfire;
using PrayerTasker.Api.DI;
using PrayerTasker.Application.DI;
using PrayerTasker.Infrastructure.DI;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddInfrastructureServices(builder);
builder.Services.AddApplicationServices();
builder.Services.AddPresentationServices();

// Configure CORS
// add also react app with port 3000 if needed alongwside with angular app
builder.Services.AddCors(options => options.AddPolicy("AllowAngularApp", policy => policy.WithOrigins("http://localhost:4200",
                                                                                                      "http://localhost:3000",
                                                                                                      "https://localhost:4200",
                                                                                                      "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

// ?: Fix Maghrib is empty in Prayer Times response (Done)


WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngularApp");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard();
app.MapControllers();
await app.RunAsync();
