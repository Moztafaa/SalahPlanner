# Clean Architecture Layering Domain

## Overview

The backend follows Clean Architecture (also known as Onion Architecture or Hexagonal Architecture) with clear separation of concerns across four layers: Domain, Application, Infrastructure, and Presentation (API).

## Layer Structure

```
SalahPlanner/
├── src/
│   ├── PrayerTasker.Domain/         # Core business logic
│   ├── PrayerTasker.Application/    # Use cases & DTOs
│   ├── PrayerTasker.Infrastructure/ # External concerns
│   └── PrayerTasker.Api/            # HTTP entry point
```

## Dependency Flow

**Critical Rule**: Dependencies point INWARD

```
API (Presentation)
  ↓ references
Application
  ↓ references
Domain ← Infrastructure (also references Domain)
```

- **Domain** has NO dependencies on other layers
- **Application** depends ONLY on Domain
- **Infrastructure** depends on Domain (and optionally Application for interfaces)
- **API** depends on Application and Infrastructure

## Layer Details

### 1. Domain Layer (`PrayerTasker.Domain`)

**Purpose**: Contains core business entities, enums, and repository interfaces

**Contents**:
- **Entities/** - Core business entities
  - `Taask.cs` - Task entity with validation rules
  - `DailyUserPrayerTime.cs` - Prayer time cache entity
- **IdentityEntities/** - User/role entities
  - `ApplicationUser.cs` - Extended Identity user
  - `ApplicationRole.cs` - Extended Identity role
- **Enums/** - Business enums
  - `PrayerTimeSlot.cs` - Prayer time categories
- **RepositoryInterfaces/** - Data access contracts
  - `ITaskRepository.cs`
  - `IDailyUserPrayerTimeRepository.cs`

**Dependencies**: None (only .NET BCL)

**Project File**:
```xml
<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFramework>net9.0</TargetFramework>
        <Nullable>enable</Nullable>
    </PropertyGroup>
</Project>
```

**Example Entity**:
```csharp
namespace PrayerTasker.Domain.Entities;

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

### 2. Application Layer (`PrayerTasker.Application`)

**Purpose**: Defines use cases, business logic, DTOs, and service interfaces

**Contents**:
- **Services/** - Business logic interfaces & implementations
  - `Account/IAccountService.cs`, `IJwtService.cs`
  - `TasksUseCase/ITaskService.cs`, `TaskService.cs`
  - `PrayerTimeService/IPrayerTimeService.cs`
- **DTOs/** - Data Transfer Objects for API contracts
  - `Account/` - LoginDto, RegisterDto, UserSettingsDto
  - `Task/` - CreateTaskDto, TaskDto, UpdateTaskDto
  - `PrayerTime/` - PrayerTimesDto
- **Mapping/** - AutoMapper profiles
  - `MappingProfile.cs` - Entity ↔ DTO mappings
- **DI/** - Dependency injection registration
  - `ServiceContainer.cs` - Registers Application services

**Dependencies**: Domain layer only

**Project File**:
```xml
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
```

**Example Service**:
```csharp
namespace PrayerTasker.Application.Services.TasksUseCase;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TaskService(
        ITaskRepository taskRepository,
        IMapper mapper,
        IHttpContextAccessor httpContextAccessor)
    {
        _taskRepository = taskRepository;
        _mapper = mapper;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto)
    {
        string? userId = _httpContextAccessor.HttpContext?.User
            .FindFirstValue(ClaimTypes.NameIdentifier);

        var task = _mapper.Map<Taask>(dto);
        task.Id = Guid.NewGuid();
        task.CreatedAt = DateTime.UtcNow;
        task.ApplicationUserId = Guid.Parse(userId!);

        var createdTask = await _taskRepository.CreateTaskAsync(task);
        return _mapper.Map<TaskDto>(createdTask);
    }
}
```

**Example DTO**:
```csharp
namespace PrayerTasker.Application.DTOs.Task;

public class CreateTaskDto
{
    [Required, MaxLength(100)]
    public required string Title { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime? TaskDate { get; set; }

    [Required]
    public PrayerTimeSlot Slot { get; set; }
}
```

**AutoMapper Profile**:
```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<RegisterDto, ApplicationUser>();
        CreateMap<CreateTaskDto, Taask>();
        CreateMap<Taask, TaskDto>();
        CreateMap<UpdateTaskDto, Taask>();
    }
}
```

### 3. Infrastructure Layer (`PrayerTasker.Infrastructure`)

**Purpose**: Handles external concerns - database, HTTP clients, JWT, migrations

**Contents**:
- **DatabaseContext/** - EF Core DbContext
  - `AppDbContext.cs`
- **RepositoryImplementation/** - Repository pattern implementations
  - `TaskRepository.cs`
  - `DailyUserPrayerTimeRepository.cs`
- **Jwt/** - JWT token generation
  - `JwtService.cs`
- **PrayerTimeCall/** - External API client
  - `PrayerTimeService.cs` - Calls AlAdhan API
  - `AlAdhanResponse.cs` - API response models
- **Migrations/** - EF Core database migrations
- **DI/** - Infrastructure service registration
  - `ServiceContainer.cs`

**Dependencies**: Domain, Application (for interfaces only)

**Project File**:
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.10" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.10" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="9.0.10" />
<PackageReference Include="Hangfire" Version="1.8.21" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.10" />
```

**ServiceContainer Example**:
```csharp
public static class ServiceContainer
{
    public static void AddInfrastructureServices(
        this IServiceCollection services,
        WebApplicationBuilder builder,
        IConfiguration configuration)
    {
        // Repositories
        services.AddScoped<IDailyUserPrayerTimeRepository, DailyUserPrayerTimeRepository>();
        services.AddScoped<ITaskRepository, TaskRepository>();

        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                builder.Configuration.GetConnectionString("DefaultConnection")
            )
        );

        // Identity
        services.AddIdentity<ApplicationUser, ApplicationRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // JWT Authentication
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)
                    )
                };
            });

        // External services
        services.AddHttpClient<IPrayerTimeService, PrayerTimeService>();

        // Background jobs
        services.AddHangfire(config =>
            config.UseSqlServerStorage(
                builder.Configuration.GetConnectionString("DefaultConnection")
            )
        );
        services.AddHangfireServer();
    }
}
```

### 4. API/Presentation Layer (`PrayerTasker.Api`)

**Purpose**: HTTP entry point - controllers, routing, middleware

**Contents**:
- **Controllers/** - API endpoints
  - `AccountController.cs`
  - `TaskController.cs`
  - `PrayerTimeController.cs`
- **DI/** - API service registration
  - `ServiceContainer.cs`
- **Program.cs** - Application entry point
- **appsettings.json** - Configuration

**Dependencies**: Application, Infrastructure

**Project File**:
```xml
<ProjectReference Include="../PrayerTasker.Application/PrayerTasker.Application.csproj" />
<ProjectReference Include="../PrayerTasker.Infrastructure/PrayerTasker.Infrastructure.csproj" />
```

**Program.cs** - Wiring all layers:
```csharp
WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register services from each layer
builder.Services.AddInfrastructureServices(builder, builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddPresentationServices();

// CORS
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAngularApp", policy =>
        policy.WithOrigins("http://localhost:4200", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
    )
);

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard();

app.MapControllers();
await app.RunAsync();
```

**Controller Example**:
```csharp
namespace PrayerTasker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class TaskController(ITaskService taskService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        TaskDto createdTask = await taskService.CreateTaskAsync(dto);
        return Ok(createdTask);
    }

    [HttpGet("by-date/{date}")]
    public async Task<IActionResult> GetTasksByDate(DateTime date)
    {
        List<TaskDto> tasks = await taskService.GetTasksByDateAsync(date);
        return Ok(tasks);
    }
}
```

## Key Principles

### 1. **Dependency Inversion**
High-level modules (Application) don't depend on low-level modules (Infrastructure). Both depend on abstractions (interfaces in Domain).

```csharp
// Domain defines interface
public interface ITaskRepository { }

// Application uses interface
public class TaskService
{
    private readonly ITaskRepository _taskRepository;
}

// Infrastructure implements interface
public class TaskRepository : ITaskRepository { }
```

### 2. **Separation of Concerns**
Each layer has a single responsibility:
- **Domain**: Business rules
- **Application**: Use cases
- **Infrastructure**: External integrations
- **API**: HTTP protocol

### 3. **Testability**
Interfaces allow easy mocking for unit tests:
```csharp
var mockRepository = new Mock<ITaskRepository>();
var service = new TaskService(mockRepository.Object, mapper);
```

### 4. **Service Container Pattern**
Each layer registers its own dependencies:
```csharp
// Application/DI/ServiceContainer.cs
public static void AddApplicationServices(this IServiceCollection services)
{
    services.AddScoped<ITaskService, TaskService>();
    services.AddScoped<IAccountService, AccountService>();
    services.AddAutoMapper(typeof(MappingProfile));
}
```

### 5. **Primary Constructor Syntax**
Controllers and services use C# 12 primary constructors:
```csharp
public class TaskController(ITaskService taskService) : ControllerBase
{
    // taskService automatically available in class
}
```

### 6. **DTO Pattern**
Never expose domain entities directly to API consumers:
```
Controller receives CreateTaskDto
    ↓
Service maps to Taask entity
    ↓
Repository saves Taask
    ↓
Service maps Taask to TaskDto
    ↓
Controller returns TaskDto
```

## Benefits

1. **Independent of Frameworks**: Domain/Application don't depend on EF Core, ASP.NET, etc.
2. **Testable**: Can test business logic without database or HTTP
3. **Independent of UI**: Same backend could serve multiple frontends
4. **Independent of Database**: Could swap SQL Server for MongoDB
5. **Maintainable**: Clear boundaries make changes easier

## File Organization

```
src/
├── PrayerTasker.Domain/
│   ├── Entities/
│   │   ├── DailyUserPrayerTime.cs
│   │   └── Taask.cs
│   ├── IdentityEntities/
│   │   ├── ApplicationUser.cs
│   │   └── ApplicationRole.cs
│   ├── Enums/
│   │   └── PrayerTimeSlot.cs
│   └── RepositoryInterfaces/
│       ├── ITaskRepository.cs
│       └── IDailyUserPrayerTimeRepository.cs
├── PrayerTasker.Application/
│   ├── Services/
│   ├── DTOs/
│   ├── Mapping/
│   └── DI/
├── PrayerTasker.Infrastructure/
│   ├── DatabaseContext/
│   ├── RepositoryImplementation/
│   ├── Jwt/
│   ├── PrayerTimeCall/
│   ├── Migrations/
│   └── DI/
└── PrayerTasker.Api/
    ├── Controllers/
    ├── DI/
    ├── Program.cs
    └── appsettings.json
```
