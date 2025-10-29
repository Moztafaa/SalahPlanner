using System;
using System.Threading.Tasks;
using PrayerTasker.Application.Services.PrayerTimeService;

namespace PrayerTasker.Application.Examples;

/// <summary>
/// Example usage of the PrayerTimeService
/// </summary>
public class PrayerTimeServiceExamples
{
    private readonly IPrayerTimeService _prayerTimeService;

    public PrayerTimeServiceExamples(IPrayerTimeService prayerTimeService)
    {
        _prayerTimeService = prayerTimeService;
    }

    /// <summary>
    /// Example 1: Get today's prayer times for Dubai
    /// </summary>
    public async Task GetDubaiPrayerTimesExample()
    {
        var prayerTimes = await _prayerTimeService.GetPrayerTimesAsync(
            city: "Dubai",
            country: "UAE",
            method: 8, // Gulf Region method
            date: DateTime.Today
        );

        Console.WriteLine("=== Dubai Prayer Times (Gulf Region Method) ===");
        Console.WriteLine($"Date: {prayerTimes.Date:yyyy-MM-dd}");
        Console.WriteLine($"Fajr:    {prayerTimes.Fajr}");
        Console.WriteLine($"Dhuhr:   {prayerTimes.Dhuhr}");
        Console.WriteLine($"Asr:     {prayerTimes.Asr}");
        Console.WriteLine($"Maghrib: {prayerTimes.Maghrib}");
        Console.WriteLine($"Isha:    {prayerTimes.Isha}");
    }

    /// <summary>
    /// Example 2: Get prayer times for multiple cities
    /// </summary>
    public async Task ComparePrayerTimesAcrossCities()
    {
        var cities = new[]
        {
            (City: "Dubai", Country: "UAE", Method: 8, MethodName: "Gulf Region"),
            (City: "London", Country: "UK", Method: 3, MethodName: "Muslim World League"),
            (City: "New York", Country: "USA", Method: 2, MethodName: "ISNA"),
            (City: "Istanbul", Country: "Turkey", Method: 13, MethodName: "Turkey"),
            (City: "Jakarta", Country: "Indonesia", Method: 20, MethodName: "Indonesia")
        };

        Console.WriteLine($"=== Prayer Times Comparison - {DateTime.Today:yyyy-MM-dd} ===\n");

        foreach (var (city, country, method, methodName) in cities)
        {
            try
            {
                var times = await _prayerTimeService.GetPrayerTimesAsync(
                    city, country, method, DateTime.Today);

                Console.WriteLine($"{city}, {country} ({methodName}):");
                Console.WriteLine($"  Fajr: {times.Fajr} | Dhuhr: {times.Dhuhr} | Asr: {times.Asr} | Maghrib: {times.Maghrib} | Isha: {times.Isha}\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{city}, {country}: Error - {ex.Message}\n");
            }
        }
    }

    /// <summary>
    /// Example 3: Get prayer times for a specific date
    /// </summary>
    public async Task GetPrayerTimesForSpecificDate()
    {
        var specificDate = new DateTime(2025, 12, 25);

        var prayerTimes = await _prayerTimeService.GetPrayerTimesAsync(
            city: "Makkah",
            country: "Saudi Arabia",
            method: 4, // Umm Al-Qura method
            date: specificDate
        );

        Console.WriteLine($"=== Makkah Prayer Times for {specificDate:dddd, MMMM dd, yyyy} ===");
        Console.WriteLine($"Fajr:    {prayerTimes.Fajr}");
        Console.WriteLine($"Dhuhr:   {prayerTimes.Dhuhr}");
        Console.WriteLine($"Asr:     {prayerTimes.Asr}");
        Console.WriteLine($"Maghrib: {prayerTimes.Maghrib}");
        Console.WriteLine($"Isha:    {prayerTimes.Isha}");
    }

    /// <summary>
    /// Example 4: Get prayer times for the next 7 days
    /// </summary>
    public async Task GetWeeklyPrayerTimes()
    {
        Console.WriteLine("=== Weekly Prayer Times - Cairo, Egypt ===\n");

        for (int i = 0; i < 7; i++)
        {
            var date = DateTime.Today.AddDays(i);

            var prayerTimes = await _prayerTimeService.GetPrayerTimesAsync(
                city: "Cairo",
                country: "Egypt",
                method: 5, // Egyptian General Authority
                date: date
            );

            Console.WriteLine($"{date:ddd, MMM dd} - Fajr: {prayerTimes.Fajr}, Dhuhr: {prayerTimes.Dhuhr}, Asr: {prayerTimes.Asr}, Maghrib: {prayerTimes.Maghrib}, Isha: {prayerTimes.Isha}");
        }
    }

    /// <summary>
    /// Example 5: Handle errors gracefully
    /// </summary>
    public async Task HandleErrorsExample()
    {
        try
        {
            var prayerTimes = await _prayerTimeService.GetPrayerTimesAsync(
                city: "InvalidCity",
                country: "InvalidCountry",
                method: 8,
                date: DateTime.Today
            );

            Console.WriteLine("Prayer times retrieved successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving prayer times: {ex.Message}");
            // Log the error or handle it appropriately
            // You can retry with a different method or city
        }
    }

    /// <summary>
    /// Example 6: Compare different calculation methods for the same city
    /// </summary>
    public async Task CompareDifferentMethods()
    {
        var methods = new[]
        {
            (Id: 1, Name: "Karachi"),
            (Id: 2, Name: "ISNA"),
            (Id: 3, Name: "Muslim World League"),
            (Id: 4, Name: "Umm Al-Qura"),
            (Id: 5, Name: "Egyptian")
        };

        Console.WriteLine("=== Comparing Calculation Methods for London, UK ===\n");

        foreach (var (id, name) in methods)
        {
            var times = await _prayerTimeService.GetPrayerTimesAsync(
                "London", "UK", id, DateTime.Today);

            Console.WriteLine($"{name,-25} | Fajr: {times.Fajr} | Isha: {times.Isha}");
        }

        Console.WriteLine("\nNote: Different methods mainly affect Fajr and Isha timings.");
    }
}
