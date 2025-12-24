import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterDto } from '../../models';

/**
 * Registration component for new user signup
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  // Form model
  registerData: RegisterDto = {
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  };

  // State management using signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);
  passwordMismatch = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Handle registration form submission
   */
  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Validate password confirmation
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Account created successfully! Redirecting to login...');

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Handle validation errors
        if (error.error?.errors) {
          const errors = error.error.errors;
          const errorMessages = Object.values(errors).flat();
          this.errorMessage.set(errorMessages.join('. '));
        } else if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('An error occurred during registration. Please try again.');
        }
      },
    });
  }

  /**
   * Clear error message when user starts typing
   */
  clearError(): void {
    this.errorMessage.set(null);
    this.passwordMismatch.set(false);

    // Check for password mismatch in real-time
    if (this.registerData.password && this.registerData.confirmPassword) {
      this.passwordMismatch.set(this.registerData.password !== this.registerData.confirmPassword);
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }
}
