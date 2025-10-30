using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PrayerTasker.Application.DTOs.Task;
using PrayerTasker.Application.Services.TasksUserCase;

namespace PrayerTasker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class TaskController(ITaskService taskService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        TaskDto createdTask = await taskService.CreateTaskAsync(dto);
        return Ok(createdTask);
    }

    [HttpGet("by-date/{date}")]
    public async Task<IActionResult> GetTasksByDate(DateTime date)
    {
        List<TaskDto> tasks = await taskService.GetTasksByDateAsync(date);
        return Ok(tasks);
    }
    // get task by id async
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTaskById(int id)
    {
        TaskDto? task = await taskService.GetTaskByIdAsync(id);
        if (task == null)
        {
            return NotFound();
        }
        return Ok(task);
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        TaskDto updatedTask = await taskService.UpdateTaskAsync(id, dto);
        return Ok(updatedTask);
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleTaskComplete(int id)
    {
        TaskDto toggledTask = await taskService.ToggleTaskCompleteAsync(id);
        return Ok(toggledTask);
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        await taskService.DeleteTaskAsync(id);
        return NoContent();
    }


}
