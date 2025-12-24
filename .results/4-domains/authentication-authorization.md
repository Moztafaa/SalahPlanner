# Authentication & Authorization Domain

## Overview

This domain handles user authentication, authorization, and session management using ASP.NET Core Identity with JWT Bearer tokens.

## Core Components

### Backend Services

**IJwtService** (Interface)
- Location: `src/PrayerTasker.Application/Services/Account/IJwtService.cs`
- Purpose: Define contract for JWT token generation

**JwtService** (Implementation)
- Location: `src/PrayerTasker.Infrastructure/Jwt/JwtService.cs`
- Purpose: Generate JWT tokens with user claims
- Example:
```csharp
public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public LoginResponseDto CreateToken(ApplicationUser user)
    {
        // Create claims for token
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.Email, user.Email!)
        };

        // Generate JWT token with expiration
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(24),
            signingCredentials: credentials
        );

        return new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Expiration = token.ValidTo
        };
    }
}
```

**IAccountService** (Interface)
- Location: `src/PrayerTasker.Application/Services/Account/IAccountService.cs`
- Methods:
  - `Task<LoginResponseDto> LoginAsync(LoginDto loginDto)`
  - `Task<(IdentityResult, ApplicationUser)> RegisterAsync(RegisterDto registerDto)`
  - `Task LogoutAsync()`
  - `Task<bool> IsEmailAlreadyRegistered(string email)`
  - `Task<IdentityResult> SetUserSettingsAsync(string userId, UserSettingsDto settings)`

**AccountService** (Implementation)
- Location: `src/PrayerTasker.Application/Services/Account/AccountService.cs`
- Dependencies: UserManager<ApplicationUser>, SignInManager<ApplicationUser>, IJwtService
- Example Login Flow:
```csharp
public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
{
    ApplicationUser? user = await _userManager.FindByEmailAsync(loginDto.Email)
        ?? throw new UnauthorizedAccessException("Invalid email or password.");

    SignInResult result = await _signInManager.PasswordSignInAsync(
        user.UserName!,
        loginDto.Password,
        isPersistent: false,
        lockoutOnFailure: false
    );

    if (!result.Succeeded)
    {
        throw new UnauthorizedAccessException("Invalid email or password.");
    }

    LoginResponseDto authenticationResponse = _jwtService.CreateToken(user);
    return authenticationResponse;
}
```

### API Controllers

**AccountController**
- Location: `src/PrayerTasker.Api/Controllers/AccountController.cs`
- Endpoints:
  - `POST /api/Account/register` - User registration
  - `POST /api/Account/login` - User login
  - `PUT /api/Account/me/settings` - Update user settings (requires [Authorize])

Example Controller Action:
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginDto loginDto)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    LoginResponseDto signInResult = await _accountService.LoginAsync(loginDto);
    ApplicationUser? user = await _accountService.GetUserByEmailAsync(loginDto.Email);

    if (user != null)
    {
        return Ok(new LoginResponseDto
        {
            UserId = user.Id.ToString(),
            UserName = user.UserName!,
            Email = user.Email!,
            FullName = user.FullName!,
            Token = signInResult.Token,
            Expiration = signInResult.Expiration,
            Message = "Login successful"
        });
    }

    return BadRequest(new { Message = "Login failed" });
}
```

Accessing authenticated user in protected endpoints:
```csharp
[HttpPut("me/settings")]
[Authorize]
public async Task<IActionResult> UpdateUserSettings([FromBody] UserSettingsDto settings)
{
    if (!User.Identity?.IsAuthenticated ?? true)
    {
        return Unauthorized(new { Message = "User is not authenticated" });
    }

    string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
    {
        return Unauthorized(new { Message = "User ID not found in token" });
    }

    IdentityResult result = await _accountService.SetUserSettingsAsync(userId, settings);
    // ...
}
```

### Frontend Services

**AuthService**
- Location: `Frontend/salah-planner-app/src/app/services/auth.service.ts`
- Manages authentication state using signals and BehaviorSubject
- Example:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(
    this.getUserFromStorage()
  );

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated = signal(this.hasValidToken());

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/Account/login`, credentials)
      .pipe(
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

**Auth Interceptor**
- Location: `Frontend/salah-planner-app/src/app/interceptors/auth.interceptor.ts`
- Automatically adds JWT token to outgoing HTTP requests
- Example:
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const currentUser = localStorage.getItem('currentUser');

  if (currentUser) {
    const userData = JSON.parse(currentUser);
    const token = userData.token;

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req);
};
```

**Auth Guard**
- Location: `Frontend/salah-planner-app/src/app/guards/auth.guard.ts`
- Protects routes from unauthenticated access
- Example:
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
  return false;
};
```

### Frontend Components

**LoginComponent**
- Location: `Frontend/salah-planner-app/src/app/components/login/login.component.ts`
- Reactive form for user login
- Example:
```typescript
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value as LoginDto).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.errorMessage = err.error.message
      });
    }
  }
}
```

**RegisterComponent**
- Location: `Frontend/salah-planner-app/src/app/components/register/register.component.ts`
- Reactive form for user registration

## DTOs

**LoginDto**
```csharp
public class LoginDto
{
    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Password { get; set; }
}
```

**RegisterDto**
```csharp
public class RegisterDto
{
    [Required]
    public required string UserName { get; set; }

    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string FullName { get; set; }

    [Required, MinLength(6)]
    public required string Password { get; set; }
}
```

**LoginResponseDto**
```csharp
public class LoginResponseDto
{
    public string UserId { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public string Token { get; set; }
    public DateTime Expiration { get; set; }
    public string Message { get; set; }
}
```

## Configuration

**JWT Settings** (appsettings.json)
```json
{
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "PrayerTasker.Api",
    "Audience": "PrayerTasker.Client"
  }
}
```

**JWT Configuration** (Program.cs)
```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
});
```

## Key Patterns

1. **Token-Based Authentication**: JWT tokens issued on login, stored in localStorage
2. **Claims-Based Authorization**: User identity extracted from token claims
3. **Interceptor Pattern**: Auth interceptor adds token to all HTTP requests
4. **Guard Pattern**: Route guards prevent unauthorized navigation
5. **Repository Pattern**: UserManager/SignInManager abstract identity operations
6. **Service Separation**: Auth logic separated from UI components

## User Isolation

All user-specific data (tasks, prayer times) must be filtered by `ApplicationUserId`:
```csharp
var tasks = await _taskRepository.GetTasksByDateAsync(date, userId);
```

Frontend services automatically include user context via JWT token claims.
