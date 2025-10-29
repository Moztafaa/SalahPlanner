# Prayer Tasker

A .NET 9.0 REST API for managing prayer times and tasks. Integrates with the AlAdhan API to fetch accurate Islamic prayer times for 23+ calculation methods across different regions.

## 🎯 What It Does

- Fetch prayer times from AlAdhan API with multi-region support
- Manage prayer-related tasks with user authentication (ASP.NET Core Identity)
- Background job processing with Hangfire
- RESTful API with Swagger documentation

## 🚀 Quick Start

### Prerequisites

- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- SQL Server (local or Docker)

### Setup

1. **Clone and restore**
   ```bash
   git clone https://github.com/Moztafaa/SalahPlanner.git
   cd SalahPlanner
   dotnet restore
   ```

2. **Configure database connection**

   Edit `src/PrayerTasker.Api/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=PrayerTaskerDB;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
     }
   }
   ```

   Or use User Secrets (recommended for development):
   ```bash
   cd src/PrayerTasker.Api
   dotnet user-secrets init
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Your_Connection_String"
   ```

3. **Apply migrations and run**
   ```bash
   cd src/PrayerTasker.Api
   dotnet ef database update
   dotnet run
   ```

4. **Access the API**
   - API: `https://localhost:5001`
   - Swagger UI: `https://localhost:5001/swagger`
   - Hangfire Dashboard: `https://localhost:5001/hangfire`

## 📚 Architecture

- **Domain** - Core entities and repository interfaces
- **Application** - Business logic and DTOs
- **Infrastructure** - Data access and EF Core
- **API** - REST controllers and presentation
