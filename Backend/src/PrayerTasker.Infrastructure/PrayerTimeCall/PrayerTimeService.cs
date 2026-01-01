using System.Text.Json;
using PrayerTasker.Application.DTOs.PrayerTime;
using PrayerTasker.Application.Services.PrayerTimeService;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.RepositoryInterfaces;
using PrayerTasker.Infrastructure.Exceptions;

namespace PrayerTasker.Infrastructure.PrayerTimeCall;

public class PrayerTimeService : IPrayerTimeService
{
    private readonly IDailyUserPrayerTimeRepository _dailyUserPrayerTimeRepository;
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://api.aladhan.com/v1";

    public PrayerTimeService(IDailyUserPrayerTimeRepository dailyUserPrayerTimeRepository, HttpClient httpClient)
    {
        _dailyUserPrayerTimeRepository = dailyUserPrayerTimeRepository;
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(BaseUrl);
    }

    public async Task<PrayerTimesDto> GetPrayerTimesAsync(string city, string country, int method, DateTime date, string? userId = null, double? latitude = null, double? longitude = null)
    {
        try
        {
            // Format the date as DD-MM-YYYY as required by the API
            string dateString = date.ToString("dd-MM-yyyy");

            // Build the API URL
            string url;
            if (latitude.HasValue && longitude.HasValue)
            {
                url = $"/timings/{dateString}?latitude={latitude.Value}&longitude={longitude.Value}&method={method}";
            }
            else
            {
                url = $"/timingsByCity/{dateString}?city={Uri.EscapeDataString(city)}&country={Uri.EscapeDataString(country)}&method={method}";
            }

            // Get the User from cookie

            // Check the cache from DailyUserPrayerTime table before making the API call
            // Now includes city, country, and coordinates in the cache lookup
            DailyUserPrayerTime? cachedPrayerTime = await _dailyUserPrayerTimeRepository.GetCachedPrayerTimeAsync(
                date, method, userId, city, country, latitude, longitude);

            if (cachedPrayerTime != null)
            {
                return new PrayerTimesDto
                {
                    Date = cachedPrayerTime.Date,
                    Fajr = cachedPrayerTime.Fajr!,
                    Sunrise = cachedPrayerTime.Shurooq!,
                    Dhuhr = cachedPrayerTime.Dhuhr!,
                    Asr = cachedPrayerTime.Asr!,
                    Maghrib = cachedPrayerTime.Maghrib!,
                    Isha = cachedPrayerTime.Isha!
                };
            }
            // TODO: Include timeout for HTTP calls


            // Make the API call
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // Read and deserialize the response
            string content = await response.Content.ReadAsStringAsync();

            AlAdhanApiResponse? apiResponse;
            try
            {
                apiResponse = JsonSerializer.Deserialize<AlAdhanApiResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException jsonEx)
            {
                // Log the actual response content for debugging
                throw new PrayerTimeServiceException(
                    $"Error deserializing AlAdhan API response. Content: {(content.Length > 500 ? content.Substring(0, 500) + "..." : content)}",
                    jsonEx);
            }

            if (apiResponse?.Code != 200 || apiResponse.Data?.Timings == null)
            {
                throw new PrayerTimeServiceException($"Failed to fetch prayer times. API returned code: {apiResponse?.Code}");
            }
            // Save to cache with location information
            var newPrayerTime = new DailyUserPrayerTime
            {
                Id = Guid.NewGuid(),
                Date = date,
                Fajr = apiResponse.Data.Timings.Fajr,
                Shurooq = apiResponse.Data.Timings.Sunrise,
                Dhuhr = apiResponse.Data.Timings.Dhuhr,
                Asr = apiResponse.Data.Timings.Asr,
                Maghrib = apiResponse.Data.Timings.Maghrib,
                Isha = apiResponse.Data.Timings.Isha,
                Method = method,
                City = city,
                Country = country,
                Latitude = latitude,
                Longitude = longitude,
                ApplicationUserId = !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null
            };
            await _dailyUserPrayerTimeRepository.AddPrayerTimeAsync(newPrayerTime);

            // Map the API response to our DTO
            return new PrayerTimesDto
            {
                Date = date,
                Fajr = apiResponse.Data.Timings.Fajr,
                Sunrise = apiResponse.Data.Timings.Sunrise,
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
