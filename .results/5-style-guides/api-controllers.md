# Style Guide: API Controllers

## Unique Conventions for SalahPlanner Controllers

### 1. Primary Constructor Syntax

All controllers use C# 12 primary constructor syntax for dependency injection:

**✅ Correct Pattern:**
```csharp
[Route("api/[controller]")]
[ApiController]
public class TaskController(ITaskService taskService) : ControllerBase
{
    // taskService is automatically available throughout the class

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        TaskDto createdTask = await taskService.CreateTaskAsync(dto);
        return Ok(createdTask);
    }
}
```

**❌ Avoid:**
```csharp
// Don't use traditional constructor with explicit field assignment
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }
}
```

### 2. Authorization Pattern

**Protected Controllers**: Apply `[Authorize]` attribute at controller level (not action level):

```csharp
[Authorize]  // ← Controller-level authorization
[Route("api/[controller]")]
[ApiController]
public class TaskController(ITaskService taskService) : ControllerBase
{
    // All actions require authentication by default

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        // Automatically protected
    }
}
```

**Public Controllers**: Leave `[Authorize]` off for public endpoints:

```csharp
[Route("api/[controller]")]
[ApiController]
public class AccountController(IAccountService _accountService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto registerDto)
    {
        // Public endpoint - no authorization
    }

    [HttpPut("me/settings")]
    [Authorize]  // ← Action-level authorization for specific endpoints
    public async Task<IActionResult> UpdateUserSettings([FromBody] UserSettingsDto settings)
    {
        // Protected endpoint
    }
}
```

### 3. User Context Extraction

Extract authenticated user ID from claims in protected endpoints:

```csharp
[HttpPut("me/settings")]
[Authorize]
public async Task<IActionResult> UpdateUserSettings([FromBody] UserSettingsDto settings)
{
    // Check authentication
    if (!User.Identity?.IsAuthenticated ?? true)
    {
        return Unauthorized(new { Message = "User is not authenticated" });
    }

    // Extract user ID from claims
    string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
    {
        return Unauthorized(new { Message = "User ID not found in token" });
    }

    IdentityResult result = await _accountService.SetUserSettingsAsync(userId, settings);
    // ...
}
```

### 4. Model Validation Pattern

Always validate `ModelState` before processing DTOs:

```csharp
[HttpPost]
public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
{
    // Validate incoming DTO
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    TaskDto createdTask = await taskService.CreateTaskAsync(dto);
    return Ok(createdTask);
}
```

### 5. Consistent Status Code Usage

Follow these patterns for HTTP status codes:

**Create (POST):**
```csharp
[HttpPost("register")]
public async Task<IActionResult> Register(RegisterDto registerDto)
{
    (IdentityResult? result, ApplicationUser? user) = await _accountService.RegisterAsync(registerDto);

    if (result.Succeeded && user != null)
    {
        return StatusCode(StatusCodes.Status201Created, new RegisterResponseDto
        {
            UserId = user.Id.ToString(),
            UserName = user.UserName!,
            Email = user.Email!,
            Message = "User registered successfully"
        });
    }

    return BadRequest(new { errors = result.Errors.Select(e => new { e.Code, e.Description }) });
}
```

**Read (GET):**
```csharp
[HttpGet("{id:guid}")]
public async Task<IActionResult> GetTaskById(Guid id)
{
    TaskDto? task = await taskService.GetTaskByIdAsync(id);

    if (task == null)
    {
        return NotFound();
    }

    return Ok(task);
}
```

**Update (PUT):**
```csharp
[HttpPut("{id:guid}")]
public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskDto dto)
{
    TaskDto updatedTask = await taskService.UpdateTaskAsync(id, dto);
    return Ok(updatedTask);
}
```

**Delete (DELETE):**
```csharp
[HttpDelete("{id:guid}")]
public async Task<IActionResult> DeleteTask(Guid id)
{
    await taskService.DeleteTaskAsync(id);
    return NoContent();  // 204 No Content for successful delete
}
```

**Partial Update (PATCH):**
```csharp
[HttpPatch("{id:guid}/toggle")]
public async Task<IActionResult> ToggleTaskComplete(Guid id)
{
    TaskDto toggledTask = await taskService.ToggleTaskCompleteAsync(id);
    return Ok(toggledTask);
}
```

### 6. Route Conventions

**Controller-level route template:**
```csharp
[Route("api/[controller]")]
```

**Action-level routes:**
```csharp
// RESTful resource routes
[HttpGet("{id:guid}")]           // GET /api/Task/abc123...
[HttpGet("by-date/{date}")]      // GET /api/Task/by-date/2024-01-15

// Sub-resource routes
[HttpPost("register")]            // POST /api/Account/register
[HttpPost("login")]               // POST /api/Account/login

// Action routes
[HttpPatch("{id:guid}/toggle")]  // PATCH /api/Task/abc123.../toggle
[HttpPut("me/settings")]          // PUT /api/Account/me/settings
```

### 7. Error Response Format

Return consistent error objects:

```csharp
// Simple message
return BadRequest(new { Message = "Invalid request" });

// Validation errors
return BadRequest(new
{
    errors = result.Errors.Select(e => new { e.Code, e.Description })
});

// Model state errors
if (!ModelState.IsValid)
{
    return BadRequest(ModelState);
}
```

### 8. Async Action Signatures

All controller actions must be async and return `Task<IActionResult>`:

```csharp
public async Task<IActionResult> GetTasksByDate(DateTime date)
{
    List<TaskDto> tasks = await taskService.GetTasksByDateAsync(date);
    return Ok(tasks);
}
```

### 9. Route Parameter Constraints

Use route constraints for type safety:

```csharp
[HttpGet("{id:guid}")]              // GUID constraint
[HttpGet("by-date/{date}")]         // DateTime parsing
[HttpGet("by-id/{id:int}")]         // Integer constraint
[HttpGet("by-slug/{slug:regex(^[a-z0-9-]+$)}")]  // Regex constraint
```

### 10. Service Dependency Naming

Use underscore prefix for injected services when using primary constructor:

```csharp
public class AccountController(IAccountService _accountService) : ControllerBase
//                                                 ↑ underscore prefix
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        LoginResponseDto signInResult = await _accountService.LoginAsync(loginDto);
        //                                    ↑ use with underscore
    }
}
```

### 11. Controller Inheritance

Always inherit from `ControllerBase` (not `Controller`):

```csharp
public class TaskController(ITaskService taskService) : ControllerBase
//                                                      ↑ ControllerBase for APIs
{
    // API controller - no View support needed
}
```

`ControllerBase` is for APIs; `Controller` is for MVC views.

### 12. Attribute Ordering

Maintain consistent attribute order:

```csharp
[Authorize]           // 1. Authorization
[Route("api/[controller]")]  // 2. Routing
[ApiController]       // 3. API behavior
public class TaskController(ITaskService taskService) : ControllerBase
```

### 13. Custom Email Validation

For email uniqueness checks during registration:

```csharp
[HttpPost("register")]
public async Task<IActionResult> Register(RegisterDto registerDto)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    // Custom email validation
    bool isEmailRegistered = await _accountService.IsEmailAlreadyRegistered(registerDto.Email);
    if (isEmailRegistered)
    {
        ModelState.AddModelError("Email", "Email is already in use");
        return BadRequest(ModelState);
    }

    // Proceed with registration
    (IdentityResult? result, ApplicationUser? user) = await _accountService.RegisterAsync(registerDto);
    // ...
}
```

### 14. TODO Comment Pattern

Mark future improvements with TODO comments:

```csharp
// TODO: Implement Rate limiting on login attempts to prevent brute-force attacks
public async Task<IActionResult> Login(LoginDto loginDto) { }

// TODO: PUT /api/auth/me/settings to update user settings like default city, country, calculation method, etc.
```

## Summary of Key Patterns

1. Use primary constructor syntax
2. Apply `[Authorize]` at controller level for protected resources
3. Validate `ModelState` before processing
4. Extract user ID from `User.FindFirstValue(ClaimTypes.NameIdentifier)`
5. Return appropriate status codes (200, 201, 204, 400, 401, 404)
6. Use async/await for all actions
7. Inherit from `ControllerBase`
8. Use route constraints (`:guid`, `:int`, etc.)
9. Maintain consistent error response formats
10. Prefix injected dependencies with underscore in primary constructors
