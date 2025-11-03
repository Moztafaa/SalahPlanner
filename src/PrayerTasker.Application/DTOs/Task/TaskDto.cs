using System;
using PrayerTasker.Domain.Enums;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.DTOs.Task;

public class TaskDto
{
    public Guid Id { get; set; }

    public required string Title { get; set; }
    public required string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? TaskDate { get; set; }
    public bool IsCompleted { get; set; }
    public PrayerTimeSlot Slot { get; set; }

    public Guid? ApplicationUserId { get; set; }
    // public ApplicationUser? ApplicationUser { get; set; }  // ❌ Domain entity exposed! (include sensitive info about the user and shouldn't be used in api)

}
