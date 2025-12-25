import { Platform } from "react-native";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";
import {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
  UserSettingsDto,
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskSlotDto,
  PrayerTimesDto,
  ApiError,
} from "../types";

// API Base URL - Automatically select based on platform
// - Android emulator: 10.0.2.2 (special alias to host machine)
// - iOS simulator: localhost works
// - Physical device: Use your computer's IP address
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === "android") {
      // For physical device, use your machine's IP address
      return "http://192.168.1.11:5169/api";
    } else if (Platform.OS === "ios") {
      return "http://localhost:5169/api"; // iOS simulator
      // return "http://192.168.1.11:5169/api"; // Physical iOS device
    }
  }
  return "http://192.168.1.11:5169/api"; // Default / Production
};

const API_BASE_URL = getApiBaseUrl();
console.log("Using API URL:", API_BASE_URL);

// Secure token storage keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "current_user";

// ============================================
// Axios Instance Configuration
// ============================================
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// Request Interceptor - Add JWT Token
// ============================================
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading token from secure store:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor - Handle Errors
// ============================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Debug logging for network errors
    console.log("API Error:", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
      code: error.code,
    });

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      // You can trigger navigation to login here if needed
    }
    return Promise.reject(error);
  }
);

// ============================================
// Authentication API
// ============================================
export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginDto): Promise<LoginResponseDto> => {
    const { data } = await apiClient.post<LoginResponseDto>(
      "/Account/login",
      credentials
    );
    // Store token and user data securely
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
    return data;
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterDto): Promise<RegisterResponseDto> => {
    const { data } = await apiClient.post<RegisterResponseDto>(
      "/Account/register",
      userData
    );
    return data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  /**
   * Get current user from secure storage
   */
  getCurrentUser: async (): Promise<LoginResponseDto | null> => {
    try {
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
    } catch (error) {
      console.error("Error reading user from secure store:", error);
    }
    return null;
  },

  /**
   * Get current token from secure storage
   */
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Error reading token from secure store:", error);
      return null;
    }
  },

  /**
   * Update user settings
   */
  updateSettings: async (settings: UserSettingsDto): Promise<void> => {
    await apiClient.put("/Account/me/settings", settings);
  },
};

// ============================================
// Task API
// ============================================
export const taskApi = {
  /**
   * Create new task
   */
  createTask: async (task: CreateTaskDto): Promise<Task> => {
    const { data } = await apiClient.post<Task>("/Task", task);
    return data;
  },

  /**
   * Get tasks by date
   */
  getTasksByDate: async (date: Date): Promise<Task[]> => {
    const dateStr = date.toISOString().split("T")[0];
    const { data } = await apiClient.get<Task[]>(`/Task/by-date/${dateStr}`);
    return data;
  },

  /**
   * Get task by ID
   */
  getTaskById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/Task/${id}`);
    return data;
  },

  /**
   * Update task
   */
  updateTask: async (id: string, updates: UpdateTaskDto): Promise<Task> => {
    const { data } = await apiClient.put<Task>(`/Task/${id}`, updates);
    return data;
  },

  /**
   * Toggle task completion status
   */
  toggleTaskComplete: async (id: string): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/Task/${id}/toggle`);
    return data;
  },

  /**
   * Delete task
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/Task/${id}`);
  },

  /**
   * Update tasks slot
   */
  updateTaskSlot: async (dto: UpdateTaskSlotDto): Promise<void> => {
    await apiClient.put("/Task/update-slot", dto);
  },
};

// ============================================
// Prayer Time API
// ============================================
export const prayerTimeApi = {
  /**
   * Get prayer times for specific date and location
   */
  getPrayerTimes: async (
    city: string,
    country: string,
    calculationMethod: number,
    date: Date,
    latitude?: number,
    longitude?: number
  ): Promise<PrayerTimesDto> => {
    const dateStr = date.toISOString().split("T")[0];
    const { data } = await apiClient.get<PrayerTimesDto>("/PrayerTime", {
      params: {
        date: dateStr,
        city,
        country,
        calculationMethod,
        latitude,
        longitude,
      },
    });
    return data;
  },

  /**
   * Get today's prayer times using user's default settings
   */
  getTodayPrayerTimes: async (
    city: string,
    country: string,
    calculationMethod: number,
    latitude?: number,
    longitude?: number
  ): Promise<PrayerTimesDto> => {
    const { data } = await apiClient.get<PrayerTimesDto>("/PrayerTime/today", {
      params: {
        city,
        country,
        calculationMethod,
        latitude,
        longitude,
      },
    });
    return data;
  },
};

// ============================================
// Error Handler Helper
// ============================================
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    // Network error
    if (!axiosError.response) {
      return "Network error. Please check your internet connection.";
    }

    // Server returned error
    const apiError = axiosError.response.data;

    // Validation errors
    if (apiError?.errors && Object.keys(apiError.errors).length > 0) {
      const firstError = Object.values(apiError.errors)[0];
      return firstError[0] || "Validation error occurred.";
    }

    // Generic error message
    return apiError?.message || "An unexpected error occurred.";
  }

  return "An unexpected error occurred.";
};

export default apiClient;
