import '../global.css';
import '@/src/i18n';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { DateProvider } from '@/src/contexts/DateContext';
import { ThemeProvider } from '@/src/contexts/ThemeContext';
import { PrayerTimesProvider } from '@/src/contexts/PrayerTimesContext';
import { NotificationProvider } from '@/src/contexts/NotificationContext';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox, View } from 'react-native';

// Ignore deprecated SafeAreaView warning from dependencies
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// Create QueryClient instance outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Inner component that handles auth navigation - must be inside Stack
function AuthRedirectHandler() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <AuthRedirectHandler />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DateProvider>
              <PrayerTimesProvider>
                <NotificationProvider>
                  <RootLayoutNav />
                  <Toast />
                </NotificationProvider>
              </PrayerTimesProvider>
            </DateProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
