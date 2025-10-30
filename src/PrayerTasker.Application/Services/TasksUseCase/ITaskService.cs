using PrayerTasker.Application.DTOs.Task;

namespace PrayerTasker.Application.Services.TasksUserCase;

public interface ITaskService
{
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto);
    Task<List<TaskDto>> GetTasksByDateAsync(DateTime date);
    Task<TaskDto?> GetTaskByIdAsync(int taskId);
    Task<TaskDto> UpdateTaskAsync(int taskId, UpdateTaskDto dto);
    Task<TaskDto> ToggleTaskCompleteAsync(int taskId);
    Task DeleteTaskAsync(int taskId);
}
