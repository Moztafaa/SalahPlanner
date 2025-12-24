import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, CreateTaskDto, PrayerTimeSlot, PrayerTimeSlotDisplay } from '../../models';

/**
 * Task form component for creating and editing tasks
 * Used as a modal dialog
 */
@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
})
export class TaskFormComponent implements OnInit {
  @Input() task?: Task; // If provided, edit mode
  @Input() slot?: PrayerTimeSlot; // For create mode
  @Input() selectedDate?: Date; // Date selected from calendar
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() close = new EventEmitter<void>();

  // Form data
  formData = {
    title: '',
    description: '',
    slot: PrayerTimeSlot.BeforeFajr,
    taskDate: '',
  };

  // State management
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Available prayer time slots for dropdown
  prayerTimeSlots = [
    { value: PrayerTimeSlot.BeforeFajr, label: PrayerTimeSlotDisplay[PrayerTimeSlot.BeforeFajr] },
    {
      value: PrayerTimeSlot.FajrToShurooq,
      label: PrayerTimeSlotDisplay[PrayerTimeSlot.FajrToShurooq],
    },
    {
      value: PrayerTimeSlot.ShurooqToDhuhr,
      label: PrayerTimeSlotDisplay[PrayerTimeSlot.ShurooqToDhuhr],
    },
    { value: PrayerTimeSlot.DhuhrToAsr, label: PrayerTimeSlotDisplay[PrayerTimeSlot.DhuhrToAsr] },
    {
      value: PrayerTimeSlot.AsrToMaghrib,
      label: PrayerTimeSlotDisplay[PrayerTimeSlot.AsrToMaghrib],
    },
    {
      value: PrayerTimeSlot.MaghribToIsha,
      label: PrayerTimeSlotDisplay[PrayerTimeSlot.MaghribToIsha],
    },
    { value: PrayerTimeSlot.AfterIsha, label: PrayerTimeSlotDisplay[PrayerTimeSlot.AfterIsha] },
  ];

  // Computed properties
  get isEditMode(): boolean {
    return !!this.task;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Create New Task';
  }

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    if (this.isEditMode && this.task) {
      // Populate form with existing task data
      this.formData = {
        title: this.task.title,
        description: this.task.description,
        slot: this.task.slot,
        taskDate: this.task.taskDate ? this.formatDateForInput(this.task.taskDate) : '',
      };
    } else {
      // Set initial slot for new task
      if (this.slot !== undefined) {
        this.formData.slot = this.slot;
      }
      // Set initial date from selectedDate input or current date
      const dateToUse = this.selectedDate || new Date();
      this.formData.taskDate = this.formatDateForInput(dateToUse);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    if (this.isEditMode && this.task) {
      // Update existing task
      this.taskService
        .updateTask(this.task.id, {
          title: this.formData.title,
          description: this.formData.description,
          slot: this.formData.slot,
          isCompleted: this.task.isCompleted,
          taskDate: this.formData.taskDate ? new Date(this.formData.taskDate) : undefined,
        })
        .subscribe({
          next: (updatedTask) => {
            this.isLoading.set(false);
            this.taskUpdated.emit(updatedTask);
          },
          error: (error) => {
            this.isLoading.set(false);
            this.handleError(error);
          },
        });
    } else {
      // Create new task
      const createDto: CreateTaskDto = {
        title: this.formData.title,
        description: this.formData.description || undefined,
        slot: this.formData.slot,
        taskDate: this.formData.taskDate ? new Date(this.formData.taskDate) : undefined,
      };

      this.taskService.createTask(createDto).subscribe({
        next: (newTask) => {
          this.isLoading.set(false);
          this.taskCreated.emit(newTask);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleError(error);
        },
      });
    }
  }

  /**
   * Format date for input field (YYYY-MM-DD)
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  /**
   * Compare function for select ngModel to ensure proper type
   */
  compareSlots(slot1: any, slot2: any): boolean {
    return slot1 === slot2;
  }
}
