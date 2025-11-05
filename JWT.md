# JWT Authentication Implementation Guide

This document describes the JWT (JSON Web Token) authentication implementation in the Salah Planner project.

## Overview

JWT authentication is a stateless authentication mechanism where the server generates a signed token after successful login, and the client includes this token in subsequent requests to access protected resources.

## Implementation Steps

### 1. Add JWT Configuration to `appsettings.json`

Add the JWT settings to your configuration file:

```json
{
  "Jwt": {
    "Issuer": "SalahPlannerAPI",
    "Audience": "SalahPlannerClient",
    "EXPIRATION_MINUTES": 30,
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!@#$%"
  }
}
```

**Important:**

- The Key must be at least 32 characters long
- In production, use User Secrets or environment variables for the Key
- Never commit secrets to source control

### 2. Create JWT Service Interface

**File:** `src/PrayerTasker.Application/Services/Account/IJwtService.cs`

```csharp
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.Services.Account;

public interface IJwtService
{
    LoginResponseDto CreateToken(ApplicationUser user);
}
```

### 3. Implement JWT Service

**File:** `src/PrayerTasker.Infrastructure/Jwt/JwtService.cs`

```csharp
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Application.Services.Account;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Infrastructure.Jwt;

public class JwtService(IConfiguration configuration) : IJwtService
{
    public LoginResponseDto CreateToken(ApplicationUser user)
    {
        IConfigurationSection jwtSettings = configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

        DateTime expiration = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["EXPIRATION_MINUTES"]!));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        Claim[] claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        JwtSecurityToken token = new(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        string tokenString = tokenHandler.WriteToken(token);

        return new LoginResponseDto
        {
            Token = tokenString,
            Expiration = expiration
        };
    }
}
```

### 4. Configure JWT Authentication in DI Container

**File:** `src/PrayerTasker.Infrastructure/DI/ServiceContainer.cs`

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using PrayerTasker.Infrastructure.Jwt;

public static class ServiceContainer
{
    public static void AddInfrastructureServices(this IServiceCollection services, WebApplicationBuilder builder, IConfiguration configuration)
    {
        // ... other services ...

        // Add JWT configuration
        IConfigurationSection jwtSettings = configuration.GetSection("Jwt");
        byte[] key = System.Text.Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        services.AddAuthentication(options =>
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
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(key)
            };
        });

        services.AddAuthorization();

        // Register JWT Service
        services.AddScoped<IJwtService, JwtService>();
    }
}
```

**Important Notes:**

- Remove any cookie-based authentication configuration when using JWT
- Use `JwtBearerDefaults.AuthenticationScheme` constant instead of hardcoded strings

### 5. Update LoginResponseDto

**File:** `src/PrayerTasker.Application/DTOs/Account/LoginResponseDto.cs`

```csharp
namespace PrayerTasker.Application.DTOs.Account;

public class LoginResponseDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public string Message { get; set; } = string.Empty;
}
```

### 6. Update Account Service

**File:** `src/PrayerTasker.Application/Services/Account/AccountService.cs`

```csharp
public class AccountService(UserManager<ApplicationUser> _userManager,
                            SignInManager<ApplicationUser> _signInManager,
                            IMapper _mapper,
                            IJwtService _jwtService) : IAccountService
{
    public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
    {
        ApplicationUser? user = await _userManager.FindByEmailAsync(loginDto.Email)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        SignInResult result = await _signInManager.PasswordSignInAsync(
            user.UserName!,
            loginDto.Password,
            isPersistent: false,
            lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        LoginResponseDto authenticationResponse = _jwtService.CreateToken(user);
        return authenticationResponse;
    }

    // ... other methods ...
}
```

### 7. Update Account Controller

**File:** `src/PrayerTasker.Api/Controllers/AccountController.cs`

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

    return Unauthorized(new { Message = "Invalid email or password" });
}

[HttpPost("logout")]
public IActionResult Logout()
{
    // JWT is stateless - logout is handled client-side
    // This endpoint exists for API consistency and logging
    return Ok(new { Message = "Logged out successfully. Token should be discarded on client." });
}
```

### 8. Protect Endpoints with `[Authorize]`

Add the `[Authorize]` attribute to controllers or actions that require authentication:

```csharp
using Microsoft.AspNetCore.Authorization;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class TaskController : ControllerBase
{
    // All actions in this controller require authentication
}

// Or on specific actions:
[HttpGet("protected")]
[Authorize]
public IActionResult ProtectedEndpoint()
{
    return Ok("This is protected!");
}
```

### 9. Access User Information in Controllers

Use claims to access authenticated user information:

```csharp
using System.Security.Claims;

[Authorize]
[HttpGet("me")]
public IActionResult GetCurrentUser()
{
    string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    string? email = User.FindFirstValue(ClaimTypes.Email);
    string? userName = User.FindFirstValue(ClaimTypes.Name);

    return Ok(new { userId, email, userName });
}
```

## Frontend Integration

### Store Token After Login

```typescript
// After successful login
const response = await loginApi(email, password);
localStorage.setItem("token", response.token);
localStorage.setItem("expiration", response.expiration);
```

### Send Token with Requests

```typescript
// Add to HTTP headers
const headers = {
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
};

// Using Angular HttpClient with Interceptor
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem("token");

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }
}
```

### Handle Logout

```typescript
function logout() {
  // Remove token from storage
  localStorage.removeItem("token");
  localStorage.removeItem("expiration");

  // Optional: Call logout endpoint for logging
  await fetch("/api/Account/logout", { method: "POST" });

  // Redirect to login
  router.navigate(["/login"]);
}
```

### Check Token Expiration

```typescript
function isTokenExpired(): boolean {
  const expiration = localStorage.getItem("expiration");
  if (!expiration) return true;

  return new Date() > new Date(expiration);
}

// Check before making requests
if (isTokenExpired()) {
  logout();
  return;
}
```

## How JWT Logout Works

JWT is **stateless**, meaning the server doesn't track active sessions. Logout is handled client-side:

1. **Client-side:** Delete the token from storage (localStorage/sessionStorage)
2. **Server-side:** Optional endpoint that returns success message
3. **No server-side session invalidation** (tokens remain valid until expiration)

### Simple Client-Side Logout

```typescript
localStorage.removeItem("token");
router.navigate(["/login"]);
```

### Advanced: Token Blacklisting (Optional)

If you need immediate token invalidation:

1. Store revoked tokens in Redis/database
2. Check blacklist in middleware/authorization
3. Reject requests with blacklisted tokens

**Note:** This adds complexity and defeats JWT's stateless nature. Only implement if security requirements demand it.

## Security Best Practices

### 1. Secure the JWT Secret Key

**Development:**

```bash
cd src/PrayerTasker.Api
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "YourSecretKey"
```

**Production:**

- Use environment variables
- Use Azure Key Vault, AWS Secrets Manager, etc.
- Never commit secrets to source control

### 2. Token Expiration

- **Short expiration** (15-60 minutes) for security
- **Implement refresh tokens** for better UX
- Current setting: 30 minutes

### 3. HTTPS Only

Always use HTTPS in production to prevent token interception.

### 4. Validate Everything

```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,           // Verify token issuer
    ValidateAudience = true,         // Verify token audience
    ValidateLifetime = true,         // Check expiration
    ValidateIssuerSigningKey = true, // Verify signature
    ClockSkew = TimeSpan.Zero        // No grace period (optional)
};
```

### 5. Secure Claims

Only include necessary information in claims:

- User ID
- Email
- Username
- Roles (if needed)

**Don't include:**

- Passwords
- Sensitive personal data
- Large amounts of data

### 6. Error Messages

Use generic error messages to prevent user enumeration:

```csharp
// Good
return Unauthorized(new { Message = "Invalid credentials" });

// Bad (reveals which part failed)
return Unauthorized(new { Message = "Email not found" });
return Unauthorized(new { Message = "Invalid password" });
```

## Troubleshooting

### 401 Unauthorized on Protected Endpoints

**Check:**

1. Token is being sent in Authorization header: `Bearer <token>`
2. Token hasn't expired
3. Authentication scheme matches in DI and controllers
4. `app.UseAuthentication()` is called before `app.UseAuthorization()` in `Program.cs`

### Token Validation Fails

**Check:**

1. JWT Key in appsettings matches what was used to generate token
2. Issuer and Audience match configuration
3. Clock skew isn't causing expiration issues

### CORS Issues with Authorization Header

Ensure CORS allows credentials and Authorization header:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
```

## Testing JWT Authentication

### Using Swagger

1. Register a user via `/api/Account/register`
2. Login via `/api/Account/login` to get token
3. Click "Authorize" button in Swagger
4. Enter: `Bearer <your-token>`
5. Test protected endpoints

### Using Postman

1. POST to `/api/Account/login`
2. Copy token from response
3. Add to protected requests:
   - Header: `Authorization`
   - Value: `Bearer <token>`

### Using curl

```bash
# Login
TOKEN=$(curl -X POST http://localhost:7183/api/Account/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}' \
  | jq -r '.token')

# Use token
curl http://localhost:7183/api/Task \
  -H "Authorization: Bearer $TOKEN"
```

## Additional Resources

- [JWT.io](https://jwt.io) - JWT debugger and documentation
- [Microsoft Docs: JWT Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)
- [RFC 7519: JWT Standard](https://datatracker.ietf.org/doc/html/rfc7519)

## Future Enhancements

Consider implementing:

1. **Refresh Tokens** - For better UX without frequent re-logins
2. **Token Blacklisting** - For immediate logout if needed
3. **Role-based Authorization** - For different user permissions
4. **Multi-factor Authentication** - Additional security layer
5. **Rate Limiting** - Prevent brute force attacks on login

---

**Last Updated:** November 5, 2025
**Project:** Salah Planner
**Authentication:** JWT (Stateless)
