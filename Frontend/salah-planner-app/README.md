# Salah Planner Frontend - Angular Application

A beautiful, mobile-first Islamic prayer planner application built with Angular 20, featuring a woody color palette inspired by traditional Islamic art and architecture.

## 🎨 Features

- **Beautiful Islamic-themed UI** with warm woody colors (browns, beiges, golds)
- **Mobile-first responsive design** optimized for all screen sizes
- **Prayer Times Display** fetched from external API
- **Task Management** organized by prayer time slots
- **Drag-and-Drop** task organization between prayer times using Angular CDK
- **User Authentication** with cookie-based session management
- **Smooth Animations** and modern UX patterns

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Angular CLI 20.x
- Running instance of PrayerTime-Tasker ASP.NET Web API backend

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Update environment configuration
# Edit src/environments/environment.development.ts and set your API URL
```

### Configuration

Update the API URL in environment files:

**`src/environments/environment.development.ts`:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7183/api', // Your backend API URL
  apiTimeout: 30000,
};
```

**`src/environments/environment.ts`:**

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api', // Production API URL
  apiTimeout: 30000,
};
```

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 🔧 Backend Requirements

### ⚠️ CRITICAL: CORS Configuration

The backend **MUST** be configured to allow CORS requests from the frontend domain. Add the following to your `Program.cs` in the PrayerTasker.Api project:

```csharp
// Add before var app = builder.Build();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",  // Development
                "https://your-production-domain.com"  // Production
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();  // REQUIRED for cookie-based auth
    });
});

// Add after var app = builder.Build();
app.UseCors("AllowAngularApp");
```

**Important:** `AllowCredentials()` is required because the frontend uses cookie-based authentication.

### 🍪 Cookie Configuration

The backend uses cookie-based authentication. Ensure the following in your `Program.cs`:

```csharp
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // HTTPS only in production
    options.Cookie.SameSite = SameSiteMode.None; // Required for cross-origin requests
    options.Cookie.Name = "SalahPlannerAuth";
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;

    // Return 401 instead of redirecting to login page
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
});
```

### 📡 API Endpoints Used

The frontend consumes the following backend endpoints:

#### Authentication

- `POST /api/Account/register` - User registration
- `POST /api/Account/login` - User login
- `POST /api/Account/logout` - User logout
- `PUT /api/Account/me/settings` - Update user settings (location, calculation method)

#### Prayer Times

- `GET /api/PrayerTime?city={city}&country={country}&method={method}&date={date}` - Get prayer times
- `GET /api/PrayerTime/today?city={city}&country={country}&method={method}` - Get today's prayer times

#### Tasks

- `POST /api/Task` - Create new task
- `GET /api/Task/by-date/{date}` - Get all tasks for a date
- `GET /api/Task/{id}` - Get single task by ID
- `PUT /api/Task/{id}` - Update existing task
- `PATCH /api/Task/{id}/toggle` - Toggle task completion
- `DELETE /api/Task/{id}` - Delete task

### 🔐 Authentication Flow

1. User registers/logs in via the frontend
2. Backend sets an HTTP-only authentication cookie
3. Frontend automatically includes the cookie in all subsequent requests (via `withCredentials: true`)
4. Backend validates the cookie on protected endpoints
5. 401 responses automatically redirect users to the login page

## 📱 Mobile Optimization

The app is built mobile-first with:

- Responsive grid layouts
- Touch-friendly button sizes (min 44x44px)
- Swipe-enabled drag and drop
- Optimized font sizes for small screens
- Hamburger navigation on mobile
- Bottom sheet modals on mobile devices

## 🎨 Color Palette

The app uses a woody, Islamic-inspired color scheme:

```css
Primary: #8B5A3C (Rich wood brown)
Secondary: #C19A6B (Warm beige/tan)
Accent: #D4AF37 (Gold)
Background: #F5F1E8 (Warm off-white)
Text: #2C2416 (Dark brown)
```

Prayer time slot colors for visual organization:

- Fajr: Dawn blue
- Dhuhr: Noon gold
- Asr: Afternoon tan
- Maghrib: Sunset orange-tan
- Isha: Night blue-gray

## 🏗️ Project Structure

```
src/app/
├── components/
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── dashboard/          # Main dashboard with prayer times and tasks
│   └── task-form/          # Modal form for creating/editing tasks
├── guards/
│   └── auth.guard.ts       # Route protection (auth & guest guards)
├── interceptors/
│   └── auth.interceptor.ts # HTTP interceptor for authentication
├── models/
│   ├── account.model.ts    # User and auth models
│   ├── prayer-time-slot.enum.ts # Prayer time slot enum
│   ├── prayer-times.model.ts    # Prayer times model
│   └── task.model.ts       # Task models
├── services/
│   ├── auth.service.ts     # Authentication service
│   ├── prayer-time.service.ts   # Prayer times API service
│   └── task.service.ts     # Tasks API service
└── environments/           # Environment configuration
```

## 🔒 Security Considerations

### For Production Deployment:

1. **HTTPS Only**: Ensure the backend is served over HTTPS
2. **Secure Cookies**: Set `Cookie.SecurePolicy = CookieSecurePolicy.Always`
3. **CORS**: Restrict allowed origins to your production domain only
4. **API URL**: Update `environment.ts` with production API URL
5. **Content Security Policy**: Add CSP headers to prevent XSS
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **Input Validation**: Backend should validate all inputs
8. **SQL Injection**: Use parameterized queries (already handled by EF Core)

## 🐛 Known Limitations & Backend Improvements Needed

### Current Limitations:

1. **No Real-time Updates**: Task changes don't sync across multiple devices/tabs in real-time

   - **Suggestion**: Implement SignalR for real-time task synchronization

2. **Prayer Time Caching**: Prayer times are fetched on every page load

   - **Suggestion**: Add caching layer in backend with appropriate TTL

3. **No Offline Support**: App requires internet connection

   - **Suggestion**: Implement service worker for PWA capabilities

4. **No Task Notifications**: No reminder notifications for prayer times or tasks

   - **Suggestion**: Add push notification support

5. **Limited Error Handling**: Some API errors could have more descriptive messages
   - **Suggestion**: Standardize error response format

### Suggested Backend Enhancements:

1. **Add Pagination**: For users with many tasks

   ```csharp
   GET /api/Task/by-date/{date}?page=1&pageSize=20
   ```

2. **Add Task Search**: Search tasks by title/description

   ```csharp
   GET /api/Task/search?query={searchTerm}&page=1&pageSize=20
   ```

3. **Add Task Filtering**: Filter by completion status, date range

   ```csharp
   GET /api/Task?isCompleted=false&startDate={date}&endDate={date}
   ```

4. **Add Batch Operations**: Delete or update multiple tasks

   ```csharp
   POST /api/Task/batch-delete
   PUT /api/Task/batch-update
   ```

5. **Add Task Statistics**: Get task completion statistics

   ```csharp
   GET /api/Task/statistics?startDate={date}&endDate={date}
   ```

6. **Add User Profile**: Full user profile management

   ```csharp
   GET /api/Account/me
   PUT /api/Account/me
   ```

7. **Add Password Reset**: Forgot password functionality

   ```csharp
   POST /api/Account/forgot-password
   POST /api/Account/reset-password
   ```

8. **Add Email Verification**: Verify user email addresses

   ```csharp
   POST /api/Account/send-verification-email
   POST /api/Account/verify-email
   ```

9. **Add Refresh Tokens**: Implement refresh token flow for better security

   ```csharp
   POST /api/Account/refresh-token
   ```

10. **Add Task Categories/Tags**: Allow custom categorization
    ```csharp
    GET /api/Task/categories
    POST /api/Task/categories
    ```

## 📊 Performance Optimizations

- Lazy loading for route modules (can be implemented)
- OnPush change detection strategy where applicable
- Virtual scrolling for large task lists (can be added)
- Image optimization and lazy loading
- Service worker for caching (can be added for PWA)

## 📦 Building for Production

```bash
# Create production build
npm run build

# The build artifacts will be in the dist/ folder
# Deploy these files to your web server
```

## 🌐 Deployment

The frontend is a static Angular application and can be deployed to:

- **Azure Static Web Apps**
- **AWS S3 + CloudFront**
- **Netlify**
- **Vercel**
- **GitHub Pages**
- **Firebase Hosting**
- **Traditional web servers** (Apache, Nginx, IIS)

### Nginx Configuration Example:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/salah-planner;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📝 Environment Variables

For CI/CD pipelines, you can use environment variables:

```bash
# Example: Inject API URL during build
ng build --configuration production --base-href /app/
```

## 🤝 Contributing

When contributing, ensure:

1. Code follows Angular style guide
2. Components are well-documented
3. Responsive design is maintained
4. Accessibility standards (WCAG 2.1) are followed
5. All forms have proper validation
6. Error handling is comprehensive

## 🙏 Acknowledgments

- Prayer times powered by Aladhan API
- Islamic geometric patterns inspiration
- Angular team for the amazing framework
- Material Design principles for UX guidelines

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

Built with ❤️ for the Muslim community
