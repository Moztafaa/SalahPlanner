# Tech Stack Analysis

## Core Technology Analysis

### Programming Languages
- **Backend**: C# (.NET 9.0)
- **Frontend**: TypeScript (Angular 20.3.0)

### Primary Framework
**Backend**: ASP.NET Core 9.0 Web API
- Clean Architecture implementation
- RESTful API endpoints
- JWT Bearer Authentication via Microsoft.AspNetCore.Authentication.JwtBearer
- Entity Framework Core 9.0 for ORM
- SQL Server database

**Frontend**: Angular 20.3.0
- Standalone components architecture (no NgModules)
- Router for navigation
- Reactive Forms for user input
- HttpClient for API communication

### Secondary/Tertiary Frameworks & Libraries

**Backend**:
- **AutoMapper** (12.0.1) - Object-to-object mapping (DTO transformations)
- **Hangfire** (1.8.21) - Background job processing
- **ASP.NET Core Identity** (9.0.10) - User authentication and authorization
- **Entity Framework Core Tools** - Database migrations
- **SonarAnalyzer.CSharp** - Code quality analysis

**Frontend**:
- **Angular CDK** (20.2.10) - Component Dev Kit for UI behaviors
- **Bootstrap** (5.3.8) - UI styling framework
- **RxJS** (7.8.0) - Reactive programming
- **ngx-translate** (17.0.0) - Internationalization (i18n)
- **moment-hijri** (3.0.0) - Hijri calendar calculations
- **Jasmine/Karma** - Unit testing framework

### State Management Approach
**Frontend**:
- **Service-based state management** using Angular Services with RxJS
- **BehaviorSubjects** for reactive state (AuthService, TaskService, PrayerTimeService)
- **Local Storage** for persisting authentication tokens
- **Signal-based reactivity** (Angular 20's modern approach)

**Backend**:
- **Stateless API** following REST principles
- **Entity Framework DbContext** for data access
- **Dependency Injection** for service management

### Other Relevant Technologies & Patterns

**Backend Architecture**:
- **Clean Architecture** (Domain, Application, Infrastructure, Presentation layers)
- **Repository Pattern** for data access abstraction
- **CQRS-lite approach** through service separation (read/write operations)
- **Dependency Injection** using built-in ASP.NET Core DI container
- **DTO Pattern** for data transfer between layers

**Frontend Patterns**:
- **Standalone Components** (Angular modern approach)
- **HTTP Interceptors** for authentication token injection
- **Route Guards** for protected routes
- **Reactive Forms** with FormBuilder
- **Component-based architecture**

**Development Tools**:
- **Prettier** for code formatting
- **Angular CLI** for scaffolding and builds
- **.NET CLI** for project management
- **Entity Framework Migrations** for database versioning

---

## Domain Specificity Analysis

### Problem Domain
**Islamic Prayer Time & Task Management Platform**

The application targets Muslims who need to:
1. Track accurate prayer times for their location
2. Organize daily tasks around the five daily prayers (Salah)
3. Align productivity with Islamic spiritual practices

### Core Domain Concepts

**Islamic/Business Concepts**:
1. **Prayer Times (Salah)**: Five daily Islamic prayers
   - **Fajr** - Dawn prayer
   - **Dhuhr** - Midday prayer
   - **Asr** - Afternoon prayer
   - **Maghrib** - Sunset prayer
   - **Isha** - Night prayer
   - **Shurooq** - Sunrise (not a prayer, but important reference time)

2. **Prayer Calculation Methods**: Different Islamic organizations use varying calculation methods for prayer times based on geographic location and Islamic jurisprudence traditions

3. **Hijri Calendar**: Islamic lunar calendar integration via moment-hijri library

4. **Time Slots (PrayerTimeSlot)**: Enum-based categorization linking tasks to specific prayer times

**Task Management Concepts**:
- Task creation, updating, deletion (CRUD operations)
- Task completion tracking
- Task assignment to prayer time slots
- Drag-and-drop task reorganization between prayer times
- Date-based task filtering

**User Management**:
- Account registration and authentication
- Secure JWT-based sessions
- User-specific prayer time preferences
- Location-based settings for accurate prayer calculations

### User Interactions

**Authentication Flow**:
- User registration with email, username, password
- Login with credentials → JWT token issuance
- Token-based session management
- Secure logout

**Prayer Time Interactions**:
- View daily prayer times for current date
- Navigate to different dates via calendar
- Select prayer calculation method
- Prayer times automatically calculated based on user location and selected method

**Task Management Interactions**:
- Create tasks with title, description, prayer slot assignment
- View tasks organized by prayer time slots
- Drag-and-drop tasks between prayer times
- Mark tasks as complete/incomplete
- Edit task details
- Delete tasks
- Filter tasks by date

**Settings Management**:
- Update location preferences
- Change prayer calculation method
- Modify account information

### Primary Data Types & Structures

**Backend Domain Entities**:
```csharp
DailyUserPrayerTime {
    Id: Guid
    Date: DateTime
    Fajr, Shurooq, Dhuhr, Asr, Maghrib, Isha: string (time values)
    Method: int (calculation method ID)
    ApplicationUserId: Guid
}

Taask { // TODO: rename to TaskEntity
    Id: Guid
    Title: string (max 100 chars)
    Description: string? (max 500 chars)
    CreatedAt: DateTime
    TaskDate: DateTime?
    IsCompleted: bool
    Slot: PrayerTimeSlot (enum)
    ApplicationUserId: Guid
}

ApplicationUser (ASP.NET Identity)
ApplicationRole (ASP.NET Identity)
```

**Frontend Models**:
```typescript
Task {
    id: string
    title: string
    description?: string
    createdAt: Date
    taskDate?: Date
    isCompleted: boolean
    slot: PrayerTimeSlot
}

PrayerTimes {
    fajr, shurooq, dhuhr, asr, maghrib, isha: string
    date: Date
    method: number
}

LoginDto, RegisterDto, UserSettings
CreateTaskDto, UpdateTaskDto
```

**Enums**:
- **PrayerTimeSlot**: Fajr, Dhuhr, Asr, Maghrib, Isha

---

## Application Boundaries

### Features WITHIN Scope (Clearly Supported)

✅ **Authentication & Authorization**
- User registration and login
- JWT token-based authentication
- Protected API endpoints
- Role-based access (infrastructure in place)

✅ **Prayer Time Management**
- Fetch prayer times for specific dates
- Multiple calculation methods support
- Location-based calculations
- Daily prayer schedule display

✅ **Task Management**
- CRUD operations for tasks
- Task-to-prayer-slot assignment
- Task completion toggling
- Date-based task filtering
- User-specific task isolation

✅ **User Settings**
- Location preferences
- Prayer calculation method selection
- Account information updates

✅ **Background Jobs**
- Hangfire integration for scheduled tasks
- Potential for prayer time notifications (infrastructure ready)

✅ **Cross-Origin Support**
- CORS enabled for Angular (port 4200) and React (port 3000)
- Support for both HTTP and HTTPS

✅ **Internationalization**
- ngx-translate ready for multi-language support
- Islamic calendar (Hijri) support via moment-hijri

### Features OUTSIDE Scope (Architecturally Inconsistent)

❌ **Real-time Collaboration**
- No WebSocket/SignalR infrastructure
- Single-user task ownership model

❌ **Offline-First Capabilities**
- No service workers or IndexedDB
- Requires active internet connection

❌ **Push Notifications**
- No mobile push notification service
- Hangfire could support email/background notifications

❌ **Social Features**
- No user-to-user interactions
- No sharing or community features

❌ **Advanced Reporting/Analytics**
- No analytics infrastructure
- Basic task tracking only

❌ **File Upload/Attachments**
- No file storage infrastructure
- Tasks are text-based only

❌ **Third-Party Integrations**
- No calendar sync (Google Calendar, Outlook)
- No external prayer time API documented

### Domain Constraints

**Specialized Libraries**:
- **moment-hijri** - Suggests strong Islamic calendar requirements
- **Hangfire** - Background job processing capability

**Architectural Constraints**:
1. **Clean Architecture layers must be respected**: Domain → Application → Infrastructure → API
2. **Repository Pattern** for data access
3. **DTO Pattern** for API contracts
4. **JWT Authentication** required for protected endpoints
5. **Entity Framework Migrations** for database changes
6. **AutoMapper** for entity-DTO transformations
7. **Angular Standalone Components** (no NgModule usage)
8. **Service-based state management** (no NgRx or complex state libraries)

**Database Constraints**:
- SQL Server required (Entity Framework Core configured for SQL Server)
- GUID-based primary keys
- User isolation via ApplicationUserId foreign keys

**Islamic Domain Rules**:
- Five prayer times per day (fixed structure)
- Prayer times cannot be user-created or deleted (calculation-based)
- Tasks must be assigned to valid prayer slots
- Prayer calculation methods must align with recognized Islamic authorities

---

## Summary

**SalahPlanner** is a **full-stack Islamic prayer planner** combining:
- **Backend**: .NET 9.0 Clean Architecture API with EF Core, Identity, and Hangfire
- **Frontend**: Angular 20 standalone component app with Bootstrap styling
- **Domain**: Islamic prayer times + personal task management
- **Architecture**: Layered backend, service-based reactive frontend
- **Constraints**: SQL Server, JWT auth, prayer-slot-based task organization

The application is scoped for **individual Muslim users** to align their daily tasks with prayer schedules using accurate, location-based prayer time calculations.
