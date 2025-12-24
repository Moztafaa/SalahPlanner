import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserSettings } from '../../models';

/**
 * Settings form component for updating user location preferences
 * Used as a modal dialog
 */
@Component({
  selector: 'app-settings-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-form.component.html',
  styleUrls: ['./settings-form.component.css'],
})
export class SettingsFormComponent implements OnInit {
  @Output() settingsUpdated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // Form data
  formData = {
    defaultCity: '',
    defaultCountry: '',
    calculationMethod: 2, // Default: Islamic Society of North America (ISNA)
  };

  // State management
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Calculation methods for Islamic prayer times
  calculationMethods = [
    { value: 0, label: 'Shia Ithna-Ansari' },
    { value: 1, label: 'University of Islamic Sciences, Karachi' },
    { value: 2, label: 'Islamic Society of North America (ISNA)' },
    { value: 3, label: 'Muslim World League (MWL)' },
    { value: 4, label: 'Umm al-Qura, Makkah' },
    { value: 5, label: 'Egyptian General Authority of Survey' },
    { value: 7, label: 'Institute of Geophysics, University of Tehran' },
    { value: 8, label: 'Gulf Region' },
    { value: 9, label: 'Kuwait' },
    { value: 10, label: 'Qatar' },
    { value: 11, label: 'Majlis Ugama Islam Singapura, Singapore' },
    { value: 12, label: 'Union Organization islamic de France' },
    { value: 13, label: 'Diyanet İşleri Başkanlığı, Turkey' },
    { value: 14, label: 'Spiritual Administration of Muslims of Russia' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Load existing user settings if available
    this.loadUserSettings();
  }

  /**
   * Load existing user settings from localStorage
   */
  private loadUserSettings(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Try to load settings from localStorage
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          this.formData.defaultCity = settings.defaultCity || '';
          this.formData.defaultCountry = settings.defaultCountry || '';
          this.formData.calculationMethod = settings.calculationMethod ?? 2;
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isLoading.set(true);

    const settings: UserSettings = {
      defaultCity: this.formData.defaultCity || undefined,
      defaultCountry: this.formData.defaultCountry || undefined,
      calculationMethod: this.formData.calculationMethod,
    };

    this.authService.updateUserSettings(settings).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Settings updated successfully!');

        // Save settings to localStorage for future use
        localStorage.setItem('userSettings', JSON.stringify(settings));

        // Auto-close after 1.5 seconds
        setTimeout(() => {
          this.settingsUpdated.emit();
        }, 1500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.handleError(error);
      },
    });
  }

  /**
   * Handle error response
   */
  private handleError(error: any): void {
    if (error.error?.errors) {
      const errors = error.error.errors;
      const errorMessages = Object.values(errors).flat();
      this.errorMessage.set(errorMessages.join('. '));
    } else if (error.error?.message) {
      this.errorMessage.set(error.error.message);
    } else {
      this.errorMessage.set('An error occurred. Please try again.');
    }
  }

  /**
   * Close modal
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
