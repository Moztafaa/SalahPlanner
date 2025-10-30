using System;
using PrayerTasker.Domain.Enums;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.DTOs.Task;

public class TaskDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCompleted { get; set; }
    public PrayerTimeSlot Slot { get; set; }

    public Guid? ApplicationUserId { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }

}
