using System;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using PrayerTasker.Application.DTOs.Task;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.RepositoryInterface;

namespace PrayerTasker.Application.Services.TasksUserCase;

public class TaskService(ITaskRepository taskRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor) : ITaskService
{
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
        await taskRepository.AddAsync(task);
        return mapper.Map<TaskDto>(task);

    }
    public async Task DeleteTaskAsync(int taskId)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(Guid.Parse(taskId.ToString()), userId) ?? throw new InvalidOperationException("Task not found");
        await taskRepository.DeleteAsync(task);
    }
    public async Task<TaskDto?> GetTaskByIdAsync(int taskId)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(Guid.Parse(taskId.ToString()), userId);
        return mapper.Map<TaskDto?>(task);
    }
    public Task<List<TaskDto>> GetTasksByDateAsync(DateTime date)
    {
        string? userId = GetUserId();
        Task<List<Taask>> tasks = taskRepository.GetByDateForUserAsync(date, userId);
        return mapper.Map<Task<List<TaskDto>>>(tasks);
    }
    public async Task<TaskDto> ToggleTaskCompleteAsync(int taskId)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(Guid.Parse(taskId.ToString()), userId) ?? throw new InvalidOperationException("Task not found");
        task.IsCompleted = !task.IsCompleted;
        await taskRepository.UpdateAsync(task);
        return mapper.Map<TaskDto>(task);

    }
    public async Task<TaskDto> UpdateTaskAsync(int taskId, UpdateTaskDto dto)
    {
        string? userId = GetUserId();
        Taask? task = await taskRepository.GetByIdForUserAsync(Guid.Parse(taskId.ToString()), userId) ?? throw new InvalidOperationException("Task not found");
        task.Title = dto.Title ?? task.Title;
        task.Description = dto.Description ?? task.Description;
        task.Slot = dto.Slot ?? task.Slot;

        await taskRepository.UpdateAsync(task);
        return mapper.Map<TaskDto>(task);
    }
}
