using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PrayerTasker.Infrastructure;

internal class AlAdhanApiResponse
{
    public int Code { get; set; }
    public string Status { get; set; } = string.Empty;
    public AlAdhanData? Data { get; set; }
}

internal class AlAdhanData
{
    public AlAdhanTimings? Timings { get; set; }
    public AlAdhanDate? Date { get; set; }
    public AlAdhanMeta? Meta { get; set; }
}

internal class AlAdhanTimings
{
    public string Fajr { get; set; } = string.Empty;
    public string Sunrise { get; set; } = string.Empty;
    public string Dhuhr { get; set; } = string.Empty;
    public string Asr { get; set; } = string.Empty;
    public string Sunset { get; set; } = string.Empty;
    public string Maghrib { get; set; } = string.Empty;
    public string Isha { get; set; } = string.Empty;
    public string Imsak { get; set; } = string.Empty;
    public string Midnight { get; set; } = string.Empty;
}

internal class AlAdhanDate
{
    public string Readable { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
}

internal class AlAdhanMeta
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Timezone { get; set; } = string.Empty;
    public AlAdhanMethod? Method { get; set; }
}

internal class AlAdhanMethod
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AlAdhanMethodParams? Params { get; set; }
}

internal class AlAdhanMethodParams
{
    // These can be either numbers (degrees) or strings (e.g., "90 min")
    // Using JsonElement to handle both cases
    [JsonPropertyName("Fajr")]
    public JsonElement Fajr { get; set; }

    [JsonPropertyName("Isha")]
    public JsonElement Isha { get; set; }

    [JsonPropertyName("Maghrib")]
    public JsonElement Maghrib { get; set; }
}
