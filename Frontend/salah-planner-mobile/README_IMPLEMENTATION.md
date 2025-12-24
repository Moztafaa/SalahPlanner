# Salah Planner Mobile App

A modern React Native mobile application for organizing daily tasks around the five Islamic prayer times (Salah). Built with Expo, NativeWind, and TypeScript.

## 🌟 Features

- **Prayer Time Integration**: Automatically fetches and displays daily prayer times based on your location
- **Task Management**: Create, edit, complete, and delete tasks organized by prayer time slots
- **Floating Dock Navigation**: macOS-inspired floating navigation bar with haptic feedback
- **Calendar View**: Week-based calendar with task overview and completion tracking
- **User Authentication**: Secure JWT-based authentication with encrypted token storage
- **Offline Support**: MMKV caching for tasks and prayer times
- **Modern UI**: Light theme with light green accents using TailwindCSS/NativeWind
- **Swipe Gestures**: Swipe-to-delete and swipe-to-edit task cards
- **Prayer Countdown**: Real-time countdown to the next prayer

## 📱 Screenshots

*(Add screenshots here after testing)*

## 🛠 Tech Stack

### Frontend
- **React Native** with **Expo Router** - Cross-platform mobile framework
- **TypeScript** - Type-safe JavaScript
- **NativeWind v4** - TailwindCSS for React Native
- **TanStack Query** - Server state management and caching
- **React Native Gesture Handler** - Swipe gestures
- **Expo Secure Store** - Encrypted JWT token storage
- **React Native MMKV** - Fast offline storage
- **Axios** - HTTP client with interceptors
- **date-fns** - Date manipulation and formatting

### Backend Integration
- **.NET 9.0 Web API** - RESTful API backend
- **JWT Authentication** - Stateless authentication
- **AlAdhan API** - Prayer times calculation

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Studio (for Android development)
- Expo Go app on physical device (optional)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd Frontend/salah-planner-mobile
npm install
```

### 2. Configure API Base URL

Update the API URL in [`app/services/api.ts`](app/services/api.ts):

```typescript
const API_BASE_URL = 'http://YOUR_BACKEND_IP:5000/api';
```

**For local development:**
- iOS Simulator: `http://localhost:5000/api`
- Android Emulator: `http://10.0.2.2:5000/api`
- Physical Device: `http://YOUR_LOCAL_IP:5000/api`

### 3. Start Development Server

```bash
npm start
```

### 4. Run on Device/Simulator

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## 📂 Project Structure

```
app/
├── (auth)/                 # Authentication screens
│   ├── _layout.tsx        # Auth layout wrapper
│   ├── login.tsx          # Login screen
│   └── register.tsx       # Registration screen
├── (tabs)/                # Main app screens (tab navigation)
│   ├── _layout.tsx        # Floating dock navigation
│   ├── index.tsx          # Dashboard (Home)
│   ├── calendar.tsx       # Calendar view
│   └── settings.tsx       # User settings
├── components/            # Reusable components
│   ├── TaskCard.tsx       # Swipeable task card
│   └── AddTaskModal.tsx   # Task creation modal
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── services/              # API and storage services
│   ├── api.ts             # Axios API client
│   └── storage.ts         # MMKV storage helpers
├── types/                 # TypeScript types
│   └── index.ts           # All DTOs and enums
└── _layout.tsx            # Root layout with providers
```

## 🔐 Authentication Flow

1. User enters credentials on Login/Register screen
2. API returns JWT token and user data
3. Token stored securely in Expo Secure Store
4. Axios interceptor adds token to all API requests
5. Auth guard redirects to login if token is expired

## 📊 State Management

- **TanStack Query**: Server state (tasks, prayer times)
- **React Context**: Authentication state
- **MMKV**: Offline cache and persistent settings

## 🎨 Styling

Using **NativeWind v4** (TailwindCSS for React Native):

```tsx
<View className="bg-primary-500 rounded-xl p-4">
  <Text className="text-white font-bold">Hello World</Text>
</View>
```

**Color Palette:**
- Primary Green: `#22c55e` (primary-500)
- Light Green: `#86efac` (primary-300)
- Background: `#f9fafb` (background-gray)
- Text: `#111827` (text-primary)

## 🔄 API Integration

### Authentication

```typescript
// Login
await authApi.login({ email, password });

// Register
await authApi.register({ fullName, userName, email, password, confirmPassword });

// Logout
await authApi.logout();
```

### Tasks

```typescript
// Create task
await taskApi.createTask({ title, description, slot, taskDate });

// Get tasks by date
const tasks = await taskApi.getTasksByDate(new Date());

// Toggle completion
await taskApi.toggleTaskComplete(taskId);

// Delete task
await taskApi.deleteTask(taskId);
```

### Prayer Times

```typescript
// Get today's prayer times
const times = await prayerTimeApi.getTodayPrayerTimes(city, country, calculationMethod);
```

## 🕌 Prayer Time Slots

Tasks are organized into 7 prayer time slots:

1. **Before Fajr** - Before Fajr prayer
2. **Fajr → Shurooq** - Between Fajr and sunrise
3. **Shurooq → Dhuhr** - Morning until Dhuhr
4. **Dhuhr → Asr** - Afternoon
5. **Asr → Maghrib** - Late afternoon
6. **Maghrib → Isha** - Evening
7. **After Isha** - Night

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit
```

## 📦 Building for Production

### iOS (requires macOS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android
```

## 🔧 Configuration

### App Settings (app.json)

- App name, version, icon, splash screen
- Permissions: notifications, location (optional)
- Orientation: portrait only

### Environment Variables

Create `.env` file for configuration:

```env
API_BASE_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

### "Unable to resolve module" errors
```bash
npm install
npx expo start --clear
```

### Metro bundler issues
```bash
npx expo start --clear
# or
rm -rf node_modules && npm install
```

### iOS Simulator not launching
```bash
npx expo run:ios
```

### Android build errors
- Check Android SDK is properly installed
- Run `npx expo doctor` to diagnose issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 TODO

- [ ] Add prayer time notifications
- [ ] Implement task editing functionality
- [ ] Add task categories/tags
- [ ] Support for recurring tasks
- [ ] Dark mode support
- [ ] Localization (Arabic, French, etc.)
- [ ] Widget support (iOS/Android)
- [ ] Sync with calendar apps
- [ ] Task statistics and insights
- [ ] Backup and restore functionality

## 📄 License

This project is part of the SalahPlanner application.

## 🙏 Acknowledgments

- Prayer times API: [AlAdhan API](https://aladhan.com/prayer-times-api)
- Icons: [Expo Vector Icons](https://icons.expo.fyi/)
- UI Inspiration: macOS Big Sur, iOS 15

---

**Made with ❤️ for Muslims worldwide**
