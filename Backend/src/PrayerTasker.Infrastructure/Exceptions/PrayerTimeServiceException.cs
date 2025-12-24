using System;

namespace PrayerTasker.Infrastructure.Exceptions;

/// <summary>
/// Exception thrown when there's an error retrieving or processing prayer times from the API
/// </summary>
public class PrayerTimeServiceException : Exception
{
    public PrayerTimeServiceException(string message) : base(message)
    {
    }

    public PrayerTimeServiceException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
