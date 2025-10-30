using System;
using System.ComponentModel.DataAnnotations;
using PrayerTasker.Domain.Enums;

namespace PrayerTasker.Application.DTOs.Task;

public class UpdateTaskDto
{
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters")]
    public string? Title { get; set; }

    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public PrayerTimeSlot? Slot { get; set; }

    [Required(ErrorMessage = "IsCompleted status is required")]
    public bool? IsCompleted { get; set; }

}
