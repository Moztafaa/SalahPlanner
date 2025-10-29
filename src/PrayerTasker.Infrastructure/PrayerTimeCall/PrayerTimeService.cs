using System.Text.Json;
using PrayerTasker.Application.DTOs.PrayerTime;
using PrayerTasker.Application.Services.PrayerTimeService;
using PrayerTasker.Infrastructure.Exceptions;
namespace PrayerTasker.Infrastructure.PrayerTimeCall;

public class PrayerTimeService : IPrayerTimeService
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://api.aladhan.com/v1";

    public PrayerTimeService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(BaseUrl);
    }

    public async Task<PrayerTimesDto> GetPrayerTimesAsync(string city, string country, int method, DateTime date)
    {
        try
        {
            // Format the date as DD-MM-YYYY as required by the API
            string dateString = date.ToString("dd-MM-yyyy");

            // Build the API URL
            string url = $"/timingsByCity/{dateString}?city={Uri.EscapeDataString(city)}&country={Uri.EscapeDataString(country)}&method={method}";

            // Make the API call
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // Read and deserialize the response
            string content = await response.Content.ReadAsStringAsync();
            AlAdhanApiResponse? apiResponse = JsonSerializer.Deserialize<AlAdhanApiResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (apiResponse?.Code != 200 || apiResponse.Data?.Timings == null)
            {
                throw new PrayerTimeServiceException($"Failed to fetch prayer times. API returned code: {apiResponse?.Code}");
            }

            // Map the API response to our DTO
            return new PrayerTimesDto
            {
                Date = date,
                Fajr = apiResponse.Data.Timings.Fajr,
                Dhuhr = apiResponse.Data.Timings.Dhuhr,
                Asr = apiResponse.Data.Timings.Asr,
                Maghrib = apiResponse.Data.Timings.Maghrib,
                Isha = apiResponse.Data.Timings.Isha
            };
        }
        catch (HttpRequestException ex)
        {
            throw new PrayerTimeServiceException($"Error connecting to AlAdhan API: {ex.Message}", ex);
        }
        catch (JsonException ex)
        {
            throw new PrayerTimeServiceException($"Error parsing AlAdhan API response: {ex.Message}", ex);
        }
    }
}

// Internal classes for deserializing the AlAdhan API response
