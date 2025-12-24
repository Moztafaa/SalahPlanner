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

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      const token = await authApi.getToken();

      if (currentUser && token) {
        // Check if token is still valid
        const expiration = new Date(currentUser.expiration);
        if (expiration > new Date()) {
          setUser(currentUser);
        } else {
          // Token expired, clear storage
          await authApi.logout();
          setUser(null);
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
