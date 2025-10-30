using Microsoft.AspNetCore.Mvc;
using PrayerTasker.Application.Services.PrayerTimeService;
using PrayerTasker.Application.DTOs.PrayerTime;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PrayerTasker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class PrayerTimeController : ControllerBase
{
    private readonly IPrayerTimeService _prayerTimeService;
    private readonly ILogger<PrayerTimeController> _logger;

    public PrayerTimeController(IPrayerTimeService prayerTimeService, ILogger<PrayerTimeController> logger)
    {
        _prayerTimeService = prayerTimeService;
        _logger = logger;
    }

    /// <summary>
    /// Get prayer times for a specific city and date
    /// </summary>
    /// <param name="city">City name (e.g., "Dubai", "London")</param>
    /// <param name="country">Country name (e.g., "UAE", "UK")</param>
    /// <param name="method">Calculation method ID (default: 8 - Gulf Region)
    /// Available methods:
    /// 0 - Shia Ithna-Ashari
    /// 1 - University of Islamic Sciences, Karachi
    /// 2 - Islamic Society of North America
    /// 3 - Muslim World League
    /// 4 - Umm Al-Qura University, Makkah
    /// 5 - Egyptian General Authority of Survey
    /// 7 - Institute of Geophysics, University of Tehran
    /// 8 - Gulf Region
    /// 9 - Kuwait
    /// 10 - Qatar
    /// 11 - Majlis Ugama Islam Singapura, Singapore
    /// 12 - Union Organization islamic de France
    /// 13 - Diyanet İşleri Başkanlığı, Turkey
    /// 14 - Spiritual Administration of Muslims of Russia
    /// 15 - Moonsighting Committee Worldwide
    /// 16 - Dubai (unofficial)
    /// 17 - Jabatan Kemajuan Islam Malaysia (JAKIM)
    /// 18 - Tunisia
    /// 19 - Algeria
    /// 20 - Kementerian Agama Republik Indonesia
    /// 21 - Morocco
    /// 22 - Comunidade Islamica de Lisboa
    /// 23 - Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan
    /// 99 - Custom (requires additional methodSettings parameter)
    /// </param>
    /// <param name="date">Date in format yyyy-MM-dd (optional, defaults to today)</param>
    /// <returns>Prayer times for the specified location and date</returns>
    [HttpGet]
    public async Task<ActionResult<PrayerTimesDto>> GetPrayerTimes(
        [FromQuery] string city,
        [FromQuery] string country,
        [FromQuery] int method = 5,
        [FromQuery] string? date = null)
    {
        try
        {

            // Validate required parameters
            if (string.IsNullOrWhiteSpace(city))
            {
                return BadRequest("City parameter is required");
            }

            if (string.IsNullOrWhiteSpace(country))
            {
                return BadRequest("Country parameter is required");
            }

            // Parse date or use today
            DateTime requestDate;
            if (string.IsNullOrWhiteSpace(date))
            {
                requestDate = DateTime.Today;
            }
            else
            {
                if (!DateTime.TryParse(date, out requestDate))
                {
                    return BadRequest("Invalid date format. Use yyyy-MM-dd");
                }
            }

            // Get UserId from authenticated user if Available
            // string? userId = User?.Identity?.IsAuthenticated == true ? User.Identity.Name : null;
            string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Get prayer times
            PrayerTimesDto prayerTimes = await _prayerTimeService.GetPrayerTimesAsync(city, country, method, requestDate, userId);

            return Ok(prayerTimes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving prayer times for {City}, {Country}", city, country);
            return StatusCode(500, new { error = "An error occurred while retrieving prayer times", details = ex.Message });
        }
    }

    /// <summary>
    /// Get prayer times for today
    /// </summary>
    [HttpGet("today")]
    public async Task<ActionResult<PrayerTimesDto>> GetTodayPrayerTimes(
        [FromQuery] string city,
        [FromQuery] string country,
        [FromQuery] int method = 8)
    {
        return await GetPrayerTimes(city, country, method);
    }
}
