using System;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using PrayerTasker.Application.DTOs.Task;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.RepositoryInterfaces;

namespace PrayerTasker.Application.Services.TasksUserCase;

public class TaskService(ITaskRepository taskRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor) : ITaskService
{
    // TODO: Delegate getting userId to the controller and refactor methods to accept userId as parameter
    private string GetUserId()
    {
        string? userId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return userId ?? throw new UnauthorizedAccessException("User not found");
    }
    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto)
    {
        string? userId = GetUserId();
        Taask task = mapper.Map<Taask>(dto);
        task.ApplicationUserId = Guid.Parse(userId);
        task.IsCompleted = false;
        task.CreatedAt = DateTime.UtcNow;
        // Set TaskDate to provided value or default to current date
        task.TaskDate = dto.TaskDate ?? DateTime.UtcNow.Date;
        await taskRepository.AddAsync(task);
        return mapper.Map<TaskDto>(task);

    }
    public async Task DeleteTaskAsync(Guid taskId)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(taskId, userId) ?? throw new InvalidOperationException("Task not found");
        await taskRepository.DeleteAsync(task);
    }
    public async Task<TaskDto?> GetTaskByIdAsync(Guid taskId)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(taskId, userId);
        return mapper.Map<TaskDto?>(task);
    }
    public async Task<List<TaskDto>> GetTasksByDateAsync(DateTime date)
    {
        string? userId = GetUserId();
        List<Taask> tasks = await taskRepository.GetByDateForUserAsync(date, userId);
        return mapper.Map<List<TaskDto>>(tasks);
    }
    public async Task<TaskDto> ToggleTaskCompleteAsync(Guid taskId)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(taskId, userId) ?? throw new InvalidOperationException("Task not found");
        task.IsCompleted = !task.IsCompleted;
        await taskRepository.UpdateAsync(task);
        return mapper.Map<TaskDto>(task);

    }
    public async Task<TaskDto> UpdateTaskAsync(Guid taskId, UpdateTaskDto dto)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(taskId, userId) ?? throw new InvalidOperationException("Task not found");
        task.Title = dto.Title ?? task.Title;
        task.Description = dto.Description ?? task.Description;
        task.Slot = dto.Slot ?? task.Slot;
        task.IsCompleted = dto.IsCompleted ?? task.IsCompleted;
        if (dto.TaskDate.HasValue)
        {
            task.TaskDate = dto.TaskDate.Value.Date;
        }

        await taskRepository.UpdateAsync(task);
        return mapper.Map<TaskDto>(task);
    }
}
