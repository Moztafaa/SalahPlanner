using System.ComponentModel.DataAnnotations;
using PrayerTasker.Domain.Enums;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Domain.Entities;

// TODO: To be renamed to TaskEntity in the whole project to avoid conflict with System.Threading.Tasks.Task
public class Taask
{
    public Guid Id { get; set; }
    [Required, MaxLength(100)]
    public required string Title { get; set; }
    [MaxLength(500)]
    public string? Description { get; set; }
    [Required]
    public DateTime CreatedAt { get; set; }
    public bool IsCompleted { get; set; }
    [Required]
    public PrayerTimeSlot Slot { get; set; }

    public Guid ApplicationUserId { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }
}

