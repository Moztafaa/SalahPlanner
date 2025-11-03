# Salah Planner

A beautiful Islamic prayer planner application that helps Muslims organize their daily tasks around prayer times.

## 🎯 What It Does

**Salah Planner** provides:

- **Accurate Prayer Times**: Displays prayer times for your location based on multiple calculation methods
- **Task Management**: Create and manage tasks organized by prayer time slots (Fajr, Dhuhr, Asr, Maghrib, Isha)
- **Drag-and-Drop Interface**: Easily reorganize tasks between prayer times
- **User Accounts**: Secure authentication to save your personal tasks and preferences
- **Mobile-Friendly**: Works beautifully on phones, tablets, and desktops
- **Islamic Theme**: Designed with a warm, traditional Islamic-inspired color palette

## 👥 Who It's For

Salah Planner is designed for **Muslims who want to:**

- Stay organized during their daily prayer schedule
- Align their tasks and responsibilities with prayer times
- Have a dedicated tool that respects Islamic practices and culture
- Access prayer times on any device, anytime, anywhere

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **.NET 9.0 SDK**
- **SQL Server** (local or Docker)

### Running the Application

#### 1. Backend Setup

```bash
cd src/PrayerTasker.Api

# Configure your database connection in appsettings.json
# Set up the database
dotnet ef database update

# Start the API server
dotnet run
```

The API will be available at `https://localhost:7183`

#### 2. Frontend Setup

```bash
cd Frontend/salah-planner-app

# Install dependencies
npm install

# Start the development server
ng serve
```

Open your browser and go to `http://localhost:4200`

### Using the Application

#### Getting Started

1. **Open the application** in your web browser
2. **Create an account** or log in if you already have one
3. **Set your location** to get accurate prayer times for your area
4. **View today's prayer times** on your dashboard

#### Managing Tasks

1. **Add a task** by clicking the task creation button
2. **Assign it to a prayer time** (Fajr, Dhuhr, Asr, Maghrib, or Isha)
3. **Drag and drop tasks** between prayer times if needed
4. **Mark tasks complete** by clicking the completion button
5. **Delete tasks** when you no longer need them

#### Features to Explore

- **Change calculation methods** for prayer times based on your region
- **View different dates** to plan ahead
- **Update your account settings** for location preferences
- **Logout securely** when finished

## 💡 Why This App?

- **Culturally Relevant**: Built specifically for Muslim users, respecting Islamic practices
- **Practical**: Combines two essential needs: prayer times and task management
- **Easy to Use**: Simple, intuitive interface with no learning curve
- **Beautiful Design**: Professional UI with Islamic-inspired aesthetics
- **Responsive**: Works perfectly on any device size

---

Built with ❤️ for the Muslim community
