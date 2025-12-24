# SalahPlanner - GitHub Copilot Instructions

## Overview

**SalahPlanner** is a full-stack Islamic prayer planner application that combines prayer time tracking with task management. It enables Muslims to organize their daily tasks around the five daily prayers (Salah), aligning productivity with Islamic spiritual practices.

This document guides AI coding assistants to generate code that aligns with the project's architecture, patterns, and conventions. All patterns described here are based on actual, observed code in this codebase—not invented best practices.

---

## Tech Stack

### Backend
- **.NET 9.0** - ASP.NET Core Web API
- **Entity Framework Core 9.0** - ORM with SQL Server
- **ASP.NET Core Identity** - Authentication/Authorization
- **JWT Bearer Tokens** - Stateless API authentication
- **AutoMapper 12.0** - Entity ↔ DTO mapping
- **Hangfire 1.8** - Background job processing

### Frontend
- **Angular 20.3** - Standalone components (no NgModules)
- **TypeScript** - Strongly typed JavaScript
- **RxJS 7.8** - Reactive programming
- **Angular CDK 20.2** - Drag-and-drop functionality
- **Bootstrap 5.3** - UI styling
- **moment-hijri 3.0** - Islamic (Hijri) calendar support
- **ngx-translate 17.0** - Internationalization

### Database
- **SQL Server** - Primary data store
- **GUID Primary Keys** - All entities use Guid IDs

---

## Architecture

### Clean Architecture Layers

The backend follows Clean Architecture with strict dependency rules:

```
API (Presentation) → Application → Domain ← Infrastructure
```

**Layers:**

1. **Domain** (`PrayerTasker.Domain`)
   - Core business entities: `Taask`, `DailyUserPrayerTime`, `ApplicationUser`
   - Enums: `PrayerTimeSlot`
   - Repository interfaces: `ITaskRepository`, `IDailyUserPrayerTimeRepository`
   - **Zero external dependencies**

2. **Application** (`PrayerTasker.Application`)
   - Service interfaces and implementations
   - DTOs for API contracts
   - AutoMapper profiles
   - Business logic and use cases
   - **Depends only on Domain**

3. **Infrastructure** (`PrayerTasker.Infrastructure`)
   - Repository implementations
   - Database context (`AppDbContext`)
   - External API clients (AlAdhan prayer times API)
   - JWT token generation
   - Entity Framework migrations
   - **Depends on Domain and Application (interfaces only)**

4. **API** (`PrayerTasker.Api`)
   - REST controllers
   - HTTP routing and middleware
   - CORS configuration
   - Entry point (`Program.cs`)
   - **Depends on Application and Infrastructure**

---

## File Categories & Conventions

### Backend: API Controllers

**Location**: `src/PrayerTasker.Api/Controllers/`

**Pattern**: Primary constructor syntax with underscore-prefixed dependencies

```csharp
[Authorize]  // Controller-level for protected resources
[Route("api/[controller]")]
[ApiController]
public class TaskController(ITaskService _taskService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        TaskDto createdTask = await _taskService.CreateTaskAsync(dto);
        return Ok(createdTask);
    }

    [HttpGet("by-date/{date}")]
    public async Task<IActionResult> GetTasksByDate(DateTime date)
    {
        List<TaskDto> tasks = await _taskService.GetTasksByDateAsync(date);
        return Ok(tasks);
    }
}
```

**Key Rules:**
- Inherit from `ControllerBase` (not `Controller`)
- Use primary constructor syntax
- Prefix injected services with underscore (`_taskService`)
- Apply `[Authorize]` at controller level for protected resources
- Validate `ModelState` before processing
- Return appropriate HTTP status codes (200, 201, 204, 400, 401, 404)
- All actions must be async (`async Task<IActionResult>`)
- Use route constraints (`:guid`, `:int`)

---

### Backend: Application Services

**Location**: `src/PrayerTasker.Application/Services/`

**Pattern**: Service interface + implementation with repository dependency

```csharp
// Interface in Application layer
public interface ITaskService
{
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto);
    Task<List<TaskDto>> GetTasksByDateAsync(DateTime date);
    Task<TaskDto?> GetTaskByIdAsync(Guid id);
    Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskDto dto);
    Task DeleteTaskAsync(Guid id);
    Task<TaskDto> ToggleTaskCompleteAsync(Guid id);
}

// Implementation uses repositories and AutoMapper
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
        // Extract user ID from JWT claims
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

**Key Rules:**
- Define interfaces in Application layer
- Implementations use repositories (never DbContext directly)
- Use AutoMapper for entity ↔ DTO conversions
- Extract user ID from `IHttpContextAccessor` for user isolation
- All operations async
- Register as scoped services in DI

---

### Backend: DTOs

**Location**: `src/PrayerTasker.Application/DTOs/`

**Pattern**: Separate Create, Update, and Response DTOs

```csharp
// CreateDto - for POST requests
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

// UpdateDto - for PUT requests
public class UpdateTaskDto
{
    [Required, MaxLength(100)]
    public required string Title { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime? TaskDate { get; set; }

    [Required]
    public PrayerTimeSlot Slot { get; set; }
}

// ResponseDto - for GET responses
public class TaskDto
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? TaskDate { get; set; }
    public bool IsCompleted { get; set; }
    public PrayerTimeSlot Slot { get; set; }
}
```

**Key Rules:**
- Organize by feature: `Account/`, `Task/`, `PrayerTime/`
- Use `required` keyword for mandatory string properties
- Use Data Annotations (`[Required]`, `[MaxLength]`, `[EmailAddress]`)
- Nullable properties use `?`
- No navigation properties (flat structure)
- Provide default values for non-nullable properties (`= string.Empty`)
- Use enums directly (not strings)

---

### Backend: Domain Entities

**Location**: `src/PrayerTasker.Domain/Entities/`

**Pattern**: Entity with data annotations and navigation properties

```csharp
public class Taask  // TODO: Rename to TaskEntity
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

**Key Rules:**
- Use GUID primary keys
- Apply Data Annotations for validation
- Include foreign keys AND navigation properties
- Use `required` keyword for mandatory properties
- Enable nullable reference types

---

### Backend: Repositories

**Location**: `src/PrayerTasker.Domain/RepositoryInterfaces/` (interfaces)
**Location**: `src/PrayerTasker.Infrastructure/RepositoryImplementation/` (implementations)

**Pattern**: Interface in Domain, implementation in Infrastructure

```csharp
// Interface in Domain
public interface ITaskRepository
{
    Task<Taask> CreateTaskAsync(Taask task);
    Task<List<Taask>> GetTasksByDateAsync(DateTime date, Guid userId);
    Task<Taask?> GetTaskByIdAsync(Guid id, Guid userId);
    Task<Taask> UpdateTaskAsync(Taask task);
    Task DeleteTaskAsync(Guid id, Guid userId);
}

// Implementation in Infrastructure
public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _context;

    public TaskRepository(AppDbContext context)
    {
        _context = context;
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
}
```

**Key Rules:**
- Interfaces defined in Domain layer
- Implementations in Infrastructure layer
- All methods async
- User isolation via `ApplicationUserId` filtering
- Use LINQ for queries
- Register as scoped services

---

### Frontend: Angular Components

**Location**: `Frontend/salah-planner-app/src/app/components/`

**Pattern**: Standalone component with signal-based state

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TaskFormComponent,
    SettingsFormComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Signal-based reactive state
  prayerTimes = signal<PrayerTimes | null>(null);
  tasks = signal<Task[]>([]);
  selectedDate = signal<Date>(new Date());
  isLoading = signal(false);

  // Computed derived state
  nextSalahInfo = computed(() => this.calculateNextSalah());
  groupedTasks = computed(() => this.groupTasksBySlot());

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private prayerTimeService: PrayerTimeService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPrayerTimes();
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

**Key Rules:**
- `standalone: true` (no NgModules)
- Use Angular signals for reactive state (`signal()`, `computed()`)
- Inject services via constructor
- Implement OnInit for initialization, OnDestroy for cleanup
- Unsubscribe from observables in OnDestroy
- Each component has 3-4 files (.ts, .html, .css, .spec.ts)
- Prefix selectors with `app-`
- Import `CommonModule` for *ngIf, *ngFor

---

### Frontend: Services

**Location**: `Frontend/salah-planner-app/src/app/services/`

**Pattern**: Service with RxJS observables and signals

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(
    this.getUserFromStorage()
  );

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated = signal(this.hasValidToken());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/Account/login`,
      credentials
    ).pipe(
      tap(response => {
        localStorage.setItem('currentUser', JSON.stringify(response));
        this.currentUserSubject.next(response);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private getUserFromStorage(): LoginResponse | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}
```

**Key Rules:**
- `providedIn: 'root'` for singleton services
- Use BehaviorSubject for reactive state
- Expose observables with `asObservable()`
- Store auth tokens in localStorage
- Use HttpClient for API calls
- Return typed observables

---

### Frontend: Models (TypeScript Interfaces)

**Location**: `Frontend/salah-planner-app/src/app/models/`

**Pattern**: TypeScript interfaces mirroring backend DTOs

```typescript
export interface Task {
  id: string;               // Guid → string
  title: string;
  description?: string;
  createdAt: Date;          // DateTime → Date
  taskDate?: Date;
  isCompleted: boolean;
  slot: PrayerTimeSlot;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  taskDate?: Date;
  slot: PrayerTimeSlot;
}

export enum PrayerTimeSlot {
  Fajr = 0,
  Dhuhr = 1,
  Asr = 2,
  Maghrib = 3,
  Isha = 4
}
```

**Key Rules:**
- Mirror backend DTO structure
- Convert `Guid` → `string`
- Convert `DateTime` → `Date`
- Use `?` for optional properties
- Export all interfaces/enums
- Group related models in single file or `index.ts`

---

## Integration Rules

### Authentication & Authorization

**Backend:**
- JWT tokens generated by `JwtService`
- Protected endpoints use `[Authorize]` attribute
- User ID extracted from `User.FindFirstValue(ClaimTypes.NameIdentifier)`
- All user data filtered by `ApplicationUserId`

**Frontend:**
- Tokens stored in `localStorage`
- `authInterceptor` adds token to HTTP requests
- `authGuard` protects routes
- `AuthService` manages authentication state

### Data Access

**Required Pattern:**
- Controllers → Application Services → Repositories → DbContext
- Never access DbContext directly from controllers/services
- Use AutoMapper for all entity ↔ DTO conversions
- All database operations must be async

### User Isolation

**Every user-specific query must filter by userId:**

```csharp
// Backend repository
return await _context.Tasks
    .Where(t => t.ApplicationUserId == userId)
    .ToListAsync();

// Frontend service
getTasks(date: Date): Observable<Task[]> {
  return this.http.get<Task[]>(`${environment.apiUrl}/Task/by-date/${date}`);
  // User ID automatically included via JWT token
}
```

### Prayer Time Calculation

**External API Integration:**
- Prayer times fetched from AlAdhan API
- Cached in `DailyUserPrayerTime` table
- Cache key: (date, calculationMethod, userId)
- Frontend uses `moment-hijri` for Hijri calendar display

**Domain Constraints:**
- Five prayer times: Fajr, Dhuhr, Asr, Maghrib, Isha
- Prayer times are read-only (calculation-based, not user-editable)
- Tasks assigned to prayer time slots via `PrayerTimeSlot` enum

### Drag-and-Drop Task Management

**Frontend only (Angular CDK):**

```typescript
onTaskDrop(event: CdkDragDrop<Task[]>, targetSlot: PrayerTimeSlot): void {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update backend
    const movedTask = event.container.data[event.currentIndex];
    this.taskService.updateTask(movedTask.id, {
      title: movedTask.title,
      slot: targetSlot
    }).subscribe();
  }
}
```

---

## Feature Scaffold Guide

### Adding a New Task-Related Feature

When implementing a new task feature:

1. **Domain Entity** (if needed) - `src/PrayerTasker.Domain/Entities/`
2. **DTOs** - `src/PrayerTasker.Application/DTOs/Task/`
   - CreateXxxDto, UpdateXxxDto, XxxDto
3. **Repository Interface** - `src/PrayerTasker.Domain/RepositoryInterfaces/`
4. **Repository Implementation** - `src/PrayerTasker.Infrastructure/RepositoryImplementation/`
5. **Service Interface** - `src/PrayerTasker.Application/Services/`
6. **Service Implementation** - `src/PrayerTasker.Application/Services/`
7. **AutoMapper Profile** - Add mappings to `src/PrayerTasker.Application/Mapping/MappingProfile.cs`
8. **API Controller** - `src/PrayerTasker.Api/Controllers/`
9. **Frontend Model** - `Frontend/salah-planner-app/src/app/models/`
10. **Frontend Service** - `Frontend/salah-planner-app/src/app/services/`
11. **Frontend Component** - `Frontend/salah-planner-app/src/app/components/`

### Adding a New Angular Component

```bash
# Create component structure
mkdir -p Frontend/salah-planner-app/src/app/components/my-feature
touch Frontend/salah-planner-app/src/app/components/my-feature/my-feature.component.ts
touch Frontend/salah-planner-app/src/app/components/my-feature/my-feature.component.html
touch Frontend/salah-planner-app/src/app/components/my-feature/my-feature.component.css
```

Component template:
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-feature.component.html',
  styleUrls: ['./my-feature.component.css']
})
export class MyFeatureComponent implements OnInit {
  // Signal-based state
  data = signal<MyData[]>([]);
  isLoading = signal(false);

  constructor(
    private myService: MyService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.myService.getData().subscribe({
      next: (data) => {
        this.data.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }
}
```

---

## Example Prompt Usage

### Task: Add Task Priority Feature

**User Request:**
> "Add a priority field to tasks with three levels: Low, Medium, High. Tasks should be sortable by priority."

**Expected Implementation:**

1. **Domain Enum** (`src/PrayerTasker.Domain/Enums/TaskPriority.cs`):
```csharp
public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2
}
```

2. **Update Entity** (`src/PrayerTasker.Domain/Entities/Taask.cs`):
```csharp
[Required]
public TaskPriority Priority { get; set; } = TaskPriority.Medium;
```

3. **Update DTOs** (`src/PrayerTasker.Application/DTOs/Task/`):
```csharp
// CreateTaskDto, UpdateTaskDto, TaskDto
public TaskPriority Priority { get; set; }
```

4. **Migration**:
```bash
cd src/PrayerTasker.Infrastructure
dotnet ef migrations add AddTaskPriority --startup-project ../PrayerTasker.Api
dotnet ef database update --startup-project ../PrayerTasker.Api
```

5. **Update Repository** (`TaskRepository.cs`):
```csharp
public async Task<List<Taask>> GetTasksByDateAsync(DateTime date, Guid userId)
{
    return await _context.Tasks
        .Where(t => t.TaskDate.HasValue &&
                    t.TaskDate.Value.Date == date.Date &&
                    t.ApplicationUserId == userId)
        .OrderByDescending(t => t.Priority)  // ← Sort by priority
        .ThenBy(t => t.Slot)
        .ToListAsync();
}
```

6. **Frontend Model** (`Frontend/salah-planner-app/src/app/models/task.model.ts`):
```typescript
export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2
}

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;  // ← Add priority
  // ... other fields
}
```

7. **Update Component** (`task-form.component.ts`):
```typescript
taskForm = this.fb.group({
  title: ['', [Validators.required, Validators.maxLength(100)]],
  priority: [TaskPriority.Medium, Validators.required],  // ← Add form control
  // ... other controls
});
```

8. **Update Template** (`task-form.component.html`):
```html
<select formControlName="priority" class="form-control">
  <option [value]="TaskPriority.Low">Low</option>
  <option [value]="TaskPriority.Medium">Medium</option>
  <option [value]="TaskPriority.High">High</option>
</select>
```

---

## Important Notes

### TODOs in Codebase

- **Taask Entity**: Rename to `TaskEntity` to avoid conflict with `System.Threading.Tasks.Task`
- **Rate Limiting**: Implement rate limiting on login attempts
- **HTTP Timeouts**: Add timeout handling for external API calls
- **RTL Support**: Add right-to-left language support for Arabic

### Testing

- **Frontend**: Jasmine/Karma tests (`.spec.ts` files)
- **Backend**: Unit/integration tests not yet implemented

### CORS Configuration

API allows requests from:
- `http://localhost:4200` (Angular dev server)
- `http://localhost:3000` (React dev server for future use)

---

## Summary

This project combines:
- **.NET 9.0 Clean Architecture** backend with JWT authentication
- **Angular 20 standalone components** frontend with signal-based reactivity
- **Islamic domain**: Prayer time tracking + task management by prayer slot
- **Full-stack TypeScript/C# consistency**

**Core Principles:**
1. Clean Architecture layering with dependency inversion
2. Repository pattern for data access
3. DTO pattern for API contracts
4. Standalone Angular components with signals
5. JWT-based stateless authentication
6. User data isolation via ApplicationUserId
7. AutoMapper for all entity ↔ DTO conversions
8. Async/await for all I/O operations

When generating code, follow the exact patterns shown in this document. All examples are taken from the actual codebase.
