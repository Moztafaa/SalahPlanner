using System;
using System.ComponentModel.DataAnnotations;
using PrayerTasker.Domain.Enums;

namespace PrayerTasker.Application.DTOs.Task;

public class CreateTaskDto
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Title cannot exceed 100 characters.")]
    public required string Title { get; set; }

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Prayer time slot is required.")]
    public PrayerTimeSlot Slot { get; set; }

}
