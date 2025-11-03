import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginDto, LoginResponse, RegisterDto, RegisterResponse, UserSettings } from '../models';

/**
 * Authentication service handling user login, registration, and session management
 * Uses cookie-based authentication with the backend
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  // User state management using signals
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signal for reactive user state
  private userSignal = signal<LoginResponse | null>(null);
  public user = this.userSignal.asReadonly();
  public isAuthenticated = computed(() => this.userSignal() !== null);

  constructor(private http: HttpClient, private router: Router) {
    // Check if user data exists in localStorage on initialization
    this.loadUserFromStorage();
  }

  /**
   * Load user data from localStorage on app initialization
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as LoginResponse;
        this.setUser(user);
      } catch (error) {
        console.error('Error parsing user data from localStorage', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Set current user and persist to localStorage
   */
  private setUser(user: LoginResponse | null): void {
    this.userSignal.set(user);
    this.currentUserSubject.next(user);

    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Account/login`, credentials).pipe(
      tap((response) => {
        this.setUser(response);
      }),
      catchError((error) => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  /**
   * Register a new user account
   */
  register(data: RegisterDto): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/Account/register`, data).pipe(
      catchError((error) => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/Account/logout`, {}).pipe(
      tap(() => {
        this.setUser(null);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        // Even if logout fails on backend, clear local state
        this.setUser(null);
        this.router.navigate(['/login']);
        return of(null);
      })
    );
  }

  /**
   * Update user settings (default location and calculation method)
   */
  updateUserSettings(settings: UserSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/Account/me/settings`, settings).pipe(
      catchError((error) => {
        console.error('Error updating user settings:', error);
        throw error;
      })
    );
  }

  /**
   * Get current user data
   */
  getCurrentUser(): LoginResponse | null {
    return this.userSignal();
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}
