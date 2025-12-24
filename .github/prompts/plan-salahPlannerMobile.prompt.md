# Plan: React Native SalahPlanner Mobile App

Build a modern React Native mobile app using Expo Router with NativeWind styling that integrates with the existing .NET backend API for Islamic prayer-based task management.

## Steps

1. **Configure NativeWind and styling foundation** in `Frontend/salah-planner-mobile/`: Install `nativewind@^4.0`, `tailwindcss`, create `tailwind.config.js` with light green accent colors (`#86efac`, `#22c55e`), update `babel.config.js` with NativeWind preset.

2. **Create API layer and types** in `app/services/` and `app/types/`: Add `api.ts` with Axios instance configured with JWT interceptor, create TypeScript interfaces mirroring backend DTOs (`Task`, `PrayerTimesDto`, `LoginDto`, `LoginResponseDto`), and `PrayerTimeSlot` enum with 7 values (BeforeFajr through AfterIsha).

3. **Implement authentication flow** with `(auth)/login.tsx`, `(auth)/register.tsx`, and `AuthContext`: Use `expo-secure-store` for JWT token storage, create auth context with `login()`, `logout()`, `isAuthenticated` state, and auto-redirect guard in root `_layout.tsx`.

4. **Navigation**
   - Implement floating dock navigation in `(tabs)/_layout.tsx` using `@react-navigation/bottom-tabs`.
   - Style dock with blur, rounded corners, and light green accents.
   - Include icons (Home, Add Task, Calendar, Settings) with haptic feedback.
   - Add animation for dock hide/show on scroll.

5. **Create Dashboard screen** at `(tabs)/index.tsx`: Display prayer times countdown, render task groups organized by `PrayerTimeSlot`, implement pull-to-refresh with `RefreshControl`, add task completion toggle with swipe gestures using `react-native-gesture-handler`.

6. **Build Task management components**: Create `AddTaskModal` with slot selector dropdown and date picker (`@react-native-community/datetimepicker`), `TaskCard` component with swipe-to-delete and checkbox toggle, integrate with `POST/PUT/DELETE /api/Task` endpoints.

7. **Implement Calendar screen** at `(tabs)/calendar.tsx`: Add date picker to filter tasks by date, display tasks for selected date grouped by prayer slot, integrate with `GET /api/Task/by-date/{date}` endpoint.

8. **Create Settings screen** at `(tabs)/settings.tsx`: Form for `defaultCity`, `defaultCountry`, `calculationMethod` dropdown with labeled options (ISNA, MWL, etc.), integrate with `PUT /api/Account/me/settings`.


## Enhancements
- **State Management**: Use TanStack Query for caching + mutations.
- **Offline Mode**: Implement MMKV caching for tasks and prayer times.
- **Push Notifications**: Add `expo-notifications` for prayer reminders.
- **Testing**: Include Jest for unit tests and Detox for E2E.
- **Deployment**: Configure Expo EAS for builds and CI/CD pipeline.