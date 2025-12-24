# 🚀 Quick Start Guide - Salah Planner Mobile App

## Setup in 3 Minutes

### 1. Install Dependencies
```bash
cd Frontend/salah-planner-mobile
npm install
```

### 2. Update API URL

Open [`app/services/api.ts`](app/services/api.ts) and update line 14:

```typescript
// For iOS Simulator (if backend is on same machine)
const API_BASE_URL = 'http://localhost:5000/api';

// For Android Emulator (if backend is on same machine)
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// For Physical Device (replace with your computer's local IP)
const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
```

**To find your local IP:**
- macOS/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig` and look for IPv4 Address

### 3. Start Backend API

Ensure your .NET backend is running:

```bash
cd src/PrayerTasker.Api
dotnet run
```

The API should be accessible at `http://localhost:5000`

### 4. Start Expo Dev Server

```bash
npm start
```

### 5. Run on Device

**Option A: iOS Simulator (macOS only)**
- Press `i` in the terminal

**Option B: Android Emulator**
- Open Android Studio and start an emulator
- Press `a` in the terminal

**Option C: Physical Device**
1. Install **Expo Go** app from App Store or Play Store
2. Scan the QR code shown in the terminal
3. Make sure your phone is on the same WiFi network as your computer

## ✅ First Run Checklist

1. ✓ Backend API is running (`http://localhost:5000`)
2. ✓ Updated API_BASE_URL in `app/services/api.ts`
3. ✓ Dependencies installed (`npm install`)
4. ✓ Expo dev server started (`npm start`)
5. ✓ Device/Simulator is ready

## 🎯 Test the App

### Create an Account
1. Tap **Sign Up** on the login screen
2. Enter: Full Name, Username, Email, Password
3. Tap **Create Account**

### Add Your First Task
1. You'll be redirected to the Dashboard
2. Tap the **+ button** on any prayer time slot
3. Fill in task details
4. Select a prayer time slot
5. Tap **Create Task**

### Explore Features
- **Dashboard**: View tasks grouped by prayer times
- **Calendar**: Navigate dates and see task completion
- **Settings**: Update location and calculation method

## 🐛 Common Issues

### "Network Error" or "Unable to connect"
- ✓ Check backend API is running
- ✓ Verify API_BASE_URL is correct
- ✓ For physical device: phone and computer on same WiFi
- ✓ Disable VPN if active

### "Expo Go not connecting"
- ✓ Clear cache: `npx expo start --clear`
- ✓ Restart Expo Go app
- ✓ Try LAN connection instead of Tunnel

### Metro bundler errors
```bash
# Clear cache and restart
npx expo start --clear

# If that doesn't work
rm -rf node_modules
npm install
npx expo start --clear
```

### TypeScript errors
```bash
# Restart TypeScript server in VS Code
# Press: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## 📱 App Features Overview

### Authentication
- Secure JWT token storage
- Auto-login on app restart
- Token expiration handling

### Task Management
- Create tasks assigned to prayer slots
- Swipe left to delete
- Tap checkbox to mark complete
- Pull down to refresh

### Prayer Times
- Real-time countdown to next prayer
- Automatic location-based calculation
- Multiple calculation methods

### Settings
- Update location (city, country)
- Choose calculation method
- View user profile
- Logout

## 🔄 Development Workflow

```bash
# Start development
npm start

# Clear cache
npx expo start --clear

# Run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator

# Type checking
npx tsc --noEmit

# Lint code
npm run lint
```

## 📊 App Architecture

```
Frontend (React Native)
    ↓
Axios HTTP Client (with JWT interceptor)
    ↓
.NET Web API (http://localhost:5000/api)
    ↓
SQL Server Database
```

## 🎨 UI Components

All screens use **NativeWind** (TailwindCSS):

```tsx
// Example: Primary Button
<TouchableOpacity className="bg-primary-500 rounded-xl py-4">
  <Text className="text-white font-semibold">Button</Text>
</TouchableOpacity>
```

**Color Scheme:**
- Primary: `#22c55e` (Light Green)
- Background: `#f9fafb` (Light Gray)
- Text: `#111827` (Dark Gray)

## 🌐 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/Account/login` | POST | User login |
| `/api/Account/register` | POST | User registration |
| `/api/Task` | POST | Create task |
| `/api/Task/by-date/{date}` | GET | Get tasks by date |
| `/api/Task/{id}/toggle` | PATCH | Toggle completion |
| `/api/Task/{id}` | DELETE | Delete task |
| `/api/PrayerTime/today` | GET | Get today's prayers |

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [NativeWind Guide](https://www.nativewind.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

## 🆘 Need Help?

1. Check [README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md) for detailed docs
2. Review existing code in `app/` directory
3. Check backend API is responding: visit `http://localhost:5000/swagger` in browser
4. Run `npx expo doctor` to diagnose Expo issues

---

**Happy Coding! 🎉**
