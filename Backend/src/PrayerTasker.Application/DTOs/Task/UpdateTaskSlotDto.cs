using System.ComponentModel.DataAnnotations;
using PrayerTasker.Domain.Enums;

namespace PrayerTasker.Application.DTOs.Task;

public class UpdateTaskSlotDto
{
    [Required]
    public List<Guid> TaskIds { get; set; } = [];

    [Required]
    public PrayerTimeSlot NewSlot { get; set; }
}
