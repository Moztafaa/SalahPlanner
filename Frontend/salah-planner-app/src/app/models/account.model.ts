/**
 * Login credentials DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  message: string;
}

/**
 * Register credentials DTO
 */
export interface RegisterDto {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

/**
 * Register response from backend
 */
export interface RegisterResponse {
  userId: string;
  userName: string;
  email: string;
  message: string;
}

/**
 * User settings for default location and calculation method
 */
export interface UserSettings {
  defaultCity?: string;
  defaultCountry?: string;
  calculationMethod?: number;
}
