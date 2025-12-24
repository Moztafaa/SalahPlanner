using PrayerTasker.Application.DTOs.Task;

namespace PrayerTasker.Application.Services.TasksUserCase;

public interface ITaskService
{
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto);
    Task<List<TaskDto>> GetTasksByDateAsync(DateTime date);
    Task<TaskDto?> GetTaskByIdAsync(Guid taskId);
    Task<TaskDto> UpdateTaskAsync(Guid taskId, UpdateTaskDto dto);
    Task<TaskDto> ToggleTaskCompleteAsync(Guid taskId);
    Task DeleteTaskAsync(Guid taskId);
}
