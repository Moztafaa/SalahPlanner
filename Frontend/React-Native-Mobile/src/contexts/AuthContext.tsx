import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, handleApiError } from '../services/api';
import { LoginDto, LoginResponseDto, RegisterDto } from '../types';

interface AuthContextType {
  user: LoginResponseDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Auto-refresh token every 3 days (or when approaching expiry)
  useEffect(() => {
    if (!user || !user.refreshTokenExpiration) return; // Skip if no refresh token support

    const checkAndRefreshToken = async () => {
      try {
        const refreshToken = await authApi.getRefreshToken();
        if (!refreshToken) {
          return; // No refresh token, skip auto-refresh
        }

        // Check if refresh token is approaching expiration (refresh 1 hour before)
        const refreshExpiration = new Date(user.refreshTokenExpiration);
        const now = new Date();
        const hourBeforeExpiry = new Date(refreshExpiration.getTime() - 60 * 60 * 1000);

        if (now >= hourBeforeExpiry) {
          console.log('Refresh token approaching expiration, refreshing...');
          const newAuthData = await authApi.refreshToken(refreshToken);
          setUser(newAuthData);
        }
      } catch (error) {
        console.error('Error checking/refreshing token:', error);
        // Don't logout on refresh error, just log it
      }
    };

    // Check token status immediately
    checkAndRefreshToken();

    // Set up interval to check every hour
    const interval = setInterval(checkAndRefreshToken, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      const token = await authApi.getToken();
      const refreshToken = await authApi.getRefreshToken();

      if (currentUser && token) {
        // Check if refresh token is available and valid
        if (refreshToken && currentUser.refreshTokenExpiration) {
          const refreshExpiration = new Date(currentUser.refreshTokenExpiration);
          if (refreshExpiration > new Date()) {
            setUser(currentUser);
          } else {
            // Refresh token expired, logout
            await authApi.logout();
            setUser(null);
          }
        } else {
          // Old backend without refresh tokens - check access token
          const expiration = new Date(currentUser.expiration);
          if (expiration > new Date()) {
            setUser(currentUser);
          } else {
            // Token expired, logout
            await authApi.logout();
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginDto) => {
    try {
      const userData = await authApi.login(credentials);
      setUser(userData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  };

  const register = async (userData: RegisterDto) => {
    try {
      await authApi.register(userData);
      // After registration, auto-login
      await login({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
