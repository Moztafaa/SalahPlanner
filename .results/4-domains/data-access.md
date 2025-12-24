# Data Access Domain

## Overview

This domain manages all database interactions using Entity Framework Core 9.0 with the Repository Pattern. The architecture follows Clean Architecture principles with clear separation between domain, application, and infrastructure layers.

## Core Components

### Database Context

**AppDbContext**
- Location: `src/PrayerTasker.Infrastructure/DatabaseContext/AppDbContext.cs`
- Inherits from: `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>`
- Purpose: Central database context for EF Core operations
- Example:
```csharp
public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Taask> Tasks { get; set; }
    public DbSet<DailyUserPrayerTime> DailyUserPrayerTimes { get; set; }
}
```

### Repository Interfaces (Domain Layer)

**ITaskRepository**
- Location: `src/PrayerTasker.Domain/RepositoryInterfaces/ITaskRepository.cs`
- Defines contract for task data operations
- Example methods:
```csharp
public interface ITaskRepository
{
    Task<Taask> CreateTaskAsync(Taask task);
    Task<List<Taask>> GetTasksByDateAsync(DateTime date, Guid userId);
    Task<Taask?> GetTaskByIdAsync(Guid id, Guid userId);
    Task<Taask> UpdateTaskAsync(Taask task);
    Task DeleteTaskAsync(Guid id, Guid userId);
    Task<Taask> ToggleTaskCompleteAsync(Guid id, Guid userId);
}
```

**IDailyUserPrayerTimeRepository**
- Location: `src/PrayerTasker.Domain/RepositoryInterfaces/IDailyUserPrayerTimeRepository.cs`
- Defines contract for prayer time caching operations
- Example methods:
```csharp
public interface IDailyUserPrayerTimeRepository
{
    Task<DailyUserPrayerTime?> GetCachedPrayerTimeAsync(DateTime date, int method, string? userId);
    Task AddPrayerTimeAsync(DailyUserPrayerTime prayerTime);
}
```

### Repository Implementations (Infrastructure Layer)

**TaskRepository**
- Location: `src/PrayerTasker.Infrastructure/RepositoryImplementation/TaskRepository.cs`
- Implements ITaskRepository
- Example:
```csharp
public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _context;

    public TaskRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Taask> CreateTaskAsync(Taask task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<List<Taask>> GetTasksByDateAsync(DateTime date, Guid userId)
    {
        return await _context.Tasks
            .Where(t => t.TaskDate.HasValue &&
                        t.TaskDate.Value.Date == date.Date &&
                        t.ApplicationUserId == userId)
            .OrderBy(t => t.Slot)
            .ToListAsync();
    }

    public async Task<Taask?> GetTaskByIdAsync(Guid id, Guid userId)
    {
        return await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ApplicationUserId == userId);
    }

    public async Task<Taask> UpdateTaskAsync(Taask task)
    {
        _context.Tasks.Update(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task DeleteTaskAsync(Guid id, Guid userId)
    {
        var task = await GetTaskByIdAsync(id, userId);
        if (task != null)
        {
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<Taask> ToggleTaskCompleteAsync(Guid id, Guid userId)
    {
        var task = await GetTaskByIdAsync(id, userId);
        if (task != null)
        {
            task.IsCompleted = !task.IsCompleted;
            await _context.SaveChangesAsync();
        }
        return task!;
    }
}
```

**DailyUserPrayerTimeRepository**
- Location: `src/PrayerTasker.Infrastructure/RepositoryImplementation/DailyUserPrayerTimeRepository.cs`
- Implements IDailyUserPrayerTimeRepository
- Example:
```csharp
public class DailyUserPrayerTimeRepository : IDailyUserPrayerTimeRepository
{
    private readonly AppDbContext _context;

    public DailyUserPrayerTimeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DailyUserPrayerTime?> GetCachedPrayerTimeAsync(DateTime date, int method, string? userId)
    {
        Guid? userGuid = string.IsNullOrEmpty(userId) ? null : Guid.Parse(userId);

        return await _context.DailyUserPrayerTimes
            .FirstOrDefaultAsync(pt =>
                pt.Date.Date == date.Date &&
                pt.Method == method &&
                pt.ApplicationUserId == userGuid
            );
    }

    public async Task AddPrayerTimeAsync(DailyUserPrayerTime prayerTime)
    {
        _context.DailyUserPrayerTimes.Add(prayerTime);
        await _context.SaveChangesAsync();
    }
}
```

## Domain Entities

**Taask** (Task Entity)
- Location: `src/PrayerTasker.Domain/Entities/Taask.cs`
- Purpose: Represents a user task linked to a prayer time
- Example:
```csharp
public class Taask
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public required string Title { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    public DateTime? TaskDate { get; set; }
    public bool IsCompleted { get; set; }

    [Required]
    public PrayerTimeSlot Slot { get; set; }

    public Guid ApplicationUserId { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }
}
```

**DailyUserPrayerTime**
- Location: `src/PrayerTasker.Domain/Entities/DailyUserPrayerTime.cs`
- Purpose: Caches prayer times for specific dates to reduce external API calls
- Example:
```csharp
public class DailyUserPrayerTime
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string? Fajr { get; set; }
    public string? Shurooq { get; set; }
    public string? Dhuhr { get; set; }
    public string? Asr { get; set; }
    public string? Maghrib { get; set; }
    public string? Isha { get; set; }
    public int Method { get; set; }
    public Guid? ApplicationUserId { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }
}
```

## Database Configuration

**Connection String** (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PrayerTaskerDb;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

**DbContext Registration** (Infrastructure/DI/ServiceContainer.cs)
```csharp
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);
```

**Repository Registration**
```csharp
services.AddScoped<IDailyUserPrayerTimeRepository, DailyUserPrayerTimeRepository>();
services.AddScoped<ITaskRepository, TaskRepository>();
```

## Migrations

### Creating Migrations
```bash
cd src/PrayerTasker.Infrastructure
dotnet ef migrations add MigrationName --startup-project ../PrayerTasker.Api
```

### Applying Migrations
```bash
dotnet ef database update --startup-project ../PrayerTasker.Api
```

### Example Migrations
- `20251029150850_InitialCreate.cs` - Initial database schema
- `20251029173859_UpdateTaskEntity.cs` - Task entity modifications
- `20251103051115_AddSunriseToResponse.cs` - Added Shurooq/Sunrise field

## Key Patterns

### 1. Repository Pattern
- Abstracts data access logic
- Interfaces defined in Domain layer
- Implementations in Infrastructure layer
- Injected into Application services

### 2. Async/Await Pattern
All database operations are asynchronous:
```csharp
public async Task<Taask> CreateTaskAsync(Taask task)
{
    _context.Tasks.Add(task);
    await _context.SaveChangesAsync();
    return task;
}
```

### 3. User Isolation
All queries filter by `ApplicationUserId`:
```csharp
return await _context.Tasks
    .Where(t => t.ApplicationUserId == userId)
    .ToListAsync();
```

### 4. GUID Primary Keys
All entities use `Guid` for primary keys instead of integers:
```csharp
public Guid Id { get; set; }
```

### 5. Navigation Properties
Entity relationships defined via navigation properties:
```csharp
public Guid ApplicationUserId { get; set; }
public ApplicationUser? ApplicationUser { get; set; }
```

### 6. Required Fields
Use `[Required]` attribute for mandatory fields:
```csharp
[Required, MaxLength(100)]
public required string Title { get; set; }
```

### 7. Nullable Reference Types
Enable nullable reference types in project:
```xml
<Nullable>enable</Nullable>
```

Use `?` for nullable properties:
```csharp
public string? Description { get; set; }
public ApplicationUser? ApplicationUser { get; set; }
```

## Service Layer Integration

Application services use repositories (not DbContext directly):

```csharp
public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IMapper _mapper;

    public TaskService(ITaskRepository taskRepository, IMapper mapper)
    {
        _taskRepository = taskRepository;
        _mapper = mapper;
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto)
    {
        var task = _mapper.Map<Taask>(dto);
        task.Id = Guid.NewGuid();
        task.CreatedAt = DateTime.UtcNow;

        var createdTask = await _taskRepository.CreateTaskAsync(task);
        return _mapper.Map<TaskDto>(createdTask);
    }
}
```

## Error Handling

Repositories do not catch exceptions; errors bubble up to Application/API layers:

```csharp
// Repository - no try/catch
public async Task<Taask?> GetTaskByIdAsync(Guid id, Guid userId)
{
    return await _context.Tasks
        .FirstOrDefaultAsync(t => t.Id == id && t.ApplicationUserId == userId);
}

// Controller - handles errors
[HttpGet("{id:guid}")]
public async Task<IActionResult> GetTaskById(Guid id)
{
    TaskDto? task = await _taskService.GetTaskByIdAsync(id);
    if (task == null)
    {
        return NotFound();
    }
    return Ok(task);
}
```

## Scoped Lifetime

DbContext and repositories are registered as **Scoped** (one instance per HTTP request):

```csharp
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
);

services.AddScoped<ITaskRepository, TaskRepository>();
```

This ensures:
- Proper transaction boundaries
- No data leakage between requests
- Automatic disposal after request completes

## Query Optimization

### Eager Loading (Not Used)
Current implementation uses lazy loading/explicit queries

### Projections
Consider using projections for large datasets:
```csharp
return await _context.Tasks
    .Where(t => t.ApplicationUserId == userId)
    .Select(t => new TaskDto
    {
        Id = t.Id,
        Title = t.Title,
        // ... other properties
    })
    .ToListAsync();
```

### Indexes (TODO)
Consider adding indexes for frequently queried columns:
- `DailyUserPrayerTime`: Composite index on (Date, Method, ApplicationUserId)
- `Taask`: Composite index on (TaskDate, ApplicationUserId)
