import { Redirect } from 'expo-router';

export default function Index() {
  // This is the entry point - redirect to auth or tabs based on auth state
  // The actual redirect logic is handled in _layout.tsx
  return <Redirect href="/(auth)/login" />;
}
