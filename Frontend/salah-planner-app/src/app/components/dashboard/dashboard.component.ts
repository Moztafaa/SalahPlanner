import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { PrayerTimeService } from '../../services/prayer-time.service';
import { TaskService } from '../../services/task.service';
import { PrayerTimes, Task, PrayerTimeSlot, PrayerTimeSlotDisplay } from '../../models';
import { TaskFormComponent } from '../task-form/task-form.component';
import { SettingsFormComponent } from '../settings-form/settings-form.component';
import { CalendarModalComponent } from '../calendar-modal/calendar-modal.component';

interface TaskGroup {
  slot: PrayerTimeSlot;
  displayName: string;
  tasks: Task[];
  cssClass: string;
}

interface NextSalahInfo {
  name: string;
  time: string;
  timestamp: Date;
}

/**
 * Main dashboard component showing Salah times and task management
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TaskFormComponent,
    SettingsFormComponent,
    CalendarModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // State management using signals
  prayerTimes = signal<PrayerTimes | null>(null);
  tasks = signal<Task[]>([]);
  isLoadingPrayer = signal(true);
  isLoadingTasks = signal(true);
  errorMessage = signal<string | null>(null);
  currentDate = signal(new Date());
  currentTime = signal(new Date());

  // Timer for real-time updates
  private countdownInterval?: ReturnType<typeof setInterval>;

  // User information
  currentUser = computed(() => this.authService.getCurrentUser());

  // Task groups organized by prayer time slots
  taskGroups = computed<TaskGroup[]>(() => {
    const allTasks = this.tasks();
    const groups: TaskGroup[] = [];

    // Define all prayer time slots
    const slots = [
      { slot: PrayerTimeSlot.BeforeFajr, cssClass: 'slot-before-fajr' },
      { slot: PrayerTimeSlot.FajrToShurooq, cssClass: 'slot-fajr-shurooq' },
      { slot: PrayerTimeSlot.ShurooqToDhuhr, cssClass: 'slot-shurooq-dhuhr' },
      { slot: PrayerTimeSlot.DhuhrToAsr, cssClass: 'slot-dhuhr-asr' },
      { slot: PrayerTimeSlot.AsrToMaghrib, cssClass: 'slot-asr-maghrib' },
      { slot: PrayerTimeSlot.MaghribToIsha, cssClass: 'slot-maghrib-isha' },
      { slot: PrayerTimeSlot.AfterIsha, cssClass: 'slot-after-isha' },
    ];

    slots.forEach(({ slot, cssClass }) => {
      groups.push({
        slot,
        displayName: PrayerTimeSlotDisplay[slot],
        tasks: allTasks.filter((task) => task.slot === slot),
        cssClass,
      });
    });

    return groups;
  });

  // Modal state for task creation
  showCreateTaskModal = signal(false);
  selectedSlotForNewTask = signal<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);

  // Edit task state
  showEditTaskModal = signal(false);
  taskBeingEdited = signal<Task | null>(null);

  // Settings modal state
  showSettingsModal = signal(false);

  // Calendar modal state
  showCalendarModal = signal(false);

  constructor(
    private authService: AuthService,
    private prayerTimeService: PrayerTimeService,
    private taskService: TaskService
  ) {}

  // Computed properties for current and next Salah
  currentSalah = computed(() => {
    const times = this.prayerTimes();
    const now = this.currentTime();
    if (!times) return null;

    return this.getCurrentSalah(times, now);
  });

  nextSalah = computed(() => {
    const times = this.prayerTimes();
    const now = this.currentTime();
    if (!times) return null;

    return this.getNextSalah(times, now);
  });

  timeUntilNext = computed(() => {
    const next = this.nextSalah();
    const now = this.currentTime();
    if (!next) return '';

    return this.formatTimeRemaining(next.timestamp, now);
  });

  ngOnInit(): void {
    this.loadPrayerTimes();
    this.loadTasks();

    // Update time every second for countdown timer
    this.countdownInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Load prayer times for the current date
   */
  loadPrayerTimes(): void {
    this.isLoadingPrayer.set(true);
    this.errorMessage.set(null);

    // Try to get prayer times (will use user settings if authenticated)
    this.prayerTimeService.getPrayerTimes().subscribe({
      next: (times) => {
        this.prayerTimes.set(times);
        this.isLoadingPrayer.set(false);
      },
      error: (error) => {
        this.isLoadingPrayer.set(false);
        console.error('Error loading prayer times:', error);

        // Handle different error types
        if (error.status === 400) {
          this.errorMessage.set('Please set your location in settings to view prayer times');
        } else if (error.status === 500) {
          this.errorMessage.set(
            'Server error loading prayer times. Please try again or check your settings.'
          );
        } else {
          this.errorMessage.set(
            'Failed to load prayer times. Please check your connection and try again.'
          );
        }
      },
    });
  }

  /**
   * Load tasks for the current date
   */
  loadTasks(): void {
    this.isLoadingTasks.set(true);

    this.taskService.getTasksByDate(this.currentDate()).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoadingTasks.set(false);
      },
      error: (error) => {
        this.isLoadingTasks.set(false);
        console.error('Error loading tasks:', error);
      },
    });
  }

  /**
   * Handle drag and drop of tasks between prayer slots
   */
  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Reordering within same slot - just update the array order
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      // Note: We're not persisting the order to backend, just visual reordering
    } else {
      // Get the task being moved
      const task = event.previousContainer.data[event.previousIndex];

      // Extract target slot from container ID (format: "slot-0", "slot-1", etc.)
      const targetSlot = parseInt(event.container.id.split('-')[1]) as PrayerTimeSlot;

      // Update UI immediately for smooth UX
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task slot in backend
      this.updateTaskSlot(task.id, targetSlot);
    }
  }

  /**
   * Update task slot in the backend
   */
  updateTaskSlot(taskId: string, newSlot: PrayerTimeSlot): void {
    console.log(`Updating task ${taskId} to slot ${newSlot}`);

    this.taskService.updateTask(taskId, { slot: newSlot }).subscribe({
      next: (updatedTask) => {
        console.log('Task updated successfully:', updatedTask);

        // Update the main tasks array with the updated task
        const taskList = [...this.tasks()];
        const index = taskList.findIndex((t) => t.id === taskId);

        if (index !== -1) {
          // Replace the old task with the updated one
          taskList[index] = {
            ...taskList[index],
            slot: updatedTask.slot,
          };
          this.tasks.set(taskList);
          console.log('Local task list updated');
        }
      },
      error: (error) => {
        console.error('Error updating task slot:', error);
        alert('Failed to update task. Changes will be reverted.');
        // Reload tasks from server to revert UI changes
        this.loadTasks();
      },
    });
  }

  /**
   * Toggle task completion status
   */
  toggleTaskComplete(task: Task): void {
    this.taskService.toggleTaskComplete(task.id).subscribe({
      next: (updatedTask) => {
        const taskList = this.tasks();
        const index = taskList.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          taskList[index] = updatedTask;
          this.tasks.set([...taskList]);
        }
      },
      error: (error) => {
        console.error('Error toggling task:', error);
      },
    });
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): void {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        const taskList = this.tasks().filter((t) => t.id !== taskId);
        this.tasks.set(taskList);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
      },
    });
  }

  /**
   * Open create task modal for specific slot
   */
  openCreateTaskModal(slot: PrayerTimeSlot): void {
    this.selectedSlotForNewTask.set(slot);
    this.showCreateTaskModal.set(true);
  }

  /**
   * Close create task modal
   */
  closeCreateTaskModal(): void {
    this.showCreateTaskModal.set(false);
  }

  /**
   * Handle task created event
   */
  onTaskCreated(task: Task): void {
    const taskList = this.tasks();
    this.tasks.set([...taskList, task]);
    this.closeCreateTaskModal();
  }

  /**
   * Open edit task modal
   */
  openEditTaskModal(task: Task): void {
    this.taskBeingEdited.set(task);
    this.showEditTaskModal.set(true);
  }

  /**
   * Close edit task modal
   */
  closeEditTaskModal(): void {
    this.showEditTaskModal.set(false);
    this.taskBeingEdited.set(null);
  }

  /**
   * Handle task updated event
   */
  onTaskUpdated(updatedTask: Task): void {
    const taskList = this.tasks();
    const index = taskList.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      taskList[index] = updatedTask;
      this.tasks.set([...taskList]);
    }
    this.closeEditTaskModal();
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout().subscribe();
  }

  /**
   * Helper methods for Salah time calculations
   */

  /**
   * Determine which Salah time period we are currently in
   */
  private getCurrentSalah(times: PrayerTimes, now: Date): string | null {
    const salahTimes = [
      { name: 'Fajr', time: times.fajr },
      { name: 'Dhuhr', time: times.dhuhr },
      { name: 'Asr', time: times.asr },
      { name: 'Maghrib', time: times.maghrib },
      { name: 'Isha', time: times.isha },
    ];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < salahTimes.length; i++) {
      const salahMinutes = this.timeStringToMinutes(salahTimes[i].time);
      const nextSalahMinutes =
        i < salahTimes.length - 1 ? this.timeStringToMinutes(salahTimes[i + 1].time) : 24 * 60; // End of day

      if (currentMinutes >= salahMinutes && currentMinutes < nextSalahMinutes) {
        return salahTimes[i].name;
      }
    }

    return null;
  }

  /**
   * Get the next upcoming Salah
   */
  private getNextSalah(times: PrayerTimes, now: Date): NextSalahInfo | null {
    const salahTimes = [
      { name: 'Fajr', time: times.fajr },
      { name: 'Dhuhr', time: times.dhuhr },
      { name: 'Asr', time: times.asr },
      { name: 'Maghrib', time: times.maghrib },
      { name: 'Isha', time: times.isha },
    ];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const salah of salahTimes) {
      const salahMinutes = this.timeStringToMinutes(salah.time);

      if (salahMinutes > currentMinutes) {
        const timestamp = new Date(now);
        timestamp.setHours(Math.floor(salahMinutes / 60), salahMinutes % 60, 0, 0);

        return {
          name: salah.name,
          time: salah.time,
          timestamp,
        };
      }
    }

    // If no Salah left today, return Fajr of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fajrMinutes = this.timeStringToMinutes(salahTimes[0].time);
    tomorrow.setHours(Math.floor(fajrMinutes / 60), fajrMinutes % 60, 0, 0);

    return {
      name: 'Fajr',
      time: salahTimes[0].time,
      timestamp: tomorrow,
    };
  }

  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format the remaining time in a human-readable format
   */
  private formatTimeRemaining(targetTime: Date, now: Date): string {
    const diffMs = targetTime.getTime() - now.getTime();

    if (diffMs < 0) return '0h 0m';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const seconds = Math.floor((diffMs / 1000) % 60);

    // If less than 1 hour, show minutes and seconds
    if (hours === 0) {
      return `${minutes}m ${seconds}s`;
    }

    // If less than 24 hours, show hours and minutes
    if (hours < 24) {
      return `${hours}h ${minutes}m`;
    }

    // For longer durations, show days and hours
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  /**
   * Open settings modal
   */
  openSettingsModal(): void {
    this.showSettingsModal.set(true);
  }

  /**
   * Close settings modal
   */
  closeSettingsModal(): void {
    this.showSettingsModal.set(false);
  }

  /**
   * Handle settings updated event
   */
  onSettingsUpdated(): void {
    this.closeSettingsModal();
    // Reload prayer times with new settings
    this.loadPrayerTimes();
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user?.fullName) return 'U';

    const names = user.fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  /**
   * Get Hijri date (placeholder - would need proper Hijri calendar library)
   */
  getHijriDate(): string {
    // Placeholder - In production, use a proper Hijri calendar library
    const date = this.currentDate();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayOfWeek}, 20 Dhul-Hijjah 1445`;
  }

  /**
   * Get countdown hours
   */
  getCountdownHours(): string {
    const timeStr = this.timeUntilNext();
    const match = timeStr.match(/(\d+)h/);
    if (match) {
      return match[1].padStart(2, '0');
    }
    return '00';
  }

  /**
   * Get countdown minutes
   */
  getCountdownMinutes(): string {
    const timeStr = this.timeUntilNext();
    const match = timeStr.match(/(\d+)m/);
    if (match) {
      return match[1].padStart(2, '0');
    }
    return '00';
  }

  /**
   * Get countdown seconds
   */
  getCountdownSeconds(): string {
    const timeStr = this.timeUntilNext();
    const match = timeStr.match(/(\d+)s/);
    if (match) {
      return match[1].padStart(2, '0');
    }
    return '00';
  }

  /**
   * Get description for prayer time slot
   */
  getSlotDescription(slot: PrayerTimeSlot): string {
    const descriptions: Record<PrayerTimeSlot, string> = {
      [PrayerTimeSlot.BeforeFajr]: 'Plan your pre-dawn activities.',
      [PrayerTimeSlot.FajrToShurooq]: 'Early morning tasks after Fajr.',
      [PrayerTimeSlot.ShurooqToDhuhr]: 'Organize your morning tasks.',
      [PrayerTimeSlot.DhuhrToAsr]: 'Schedule your afternoon.',
      [PrayerTimeSlot.AsrToMaghrib]: 'Plan your late afternoon.',
      [PrayerTimeSlot.MaghribToIsha]: 'Set your evening goals.',
      [PrayerTimeSlot.AfterIsha]: 'Plan your night time tasks.',
    };
    return descriptions[slot] || 'Add tasks for this time period.';
  }

  /**
   * Open calendar modal
   */
  openCalendarModal(): void {
    this.showCalendarModal.set(true);
  }

  /**
   * Close calendar modal
   */
  closeCalendarModal(): void {
    this.showCalendarModal.set(false);
  }

  /**
   * Handle date selection from calendar
   */
  onDateSelected(date: Date): void {
    // Update current date and reload tasks for selected date
    this.currentDate.set(date);
    this.loadTasks();
    this.closeCalendarModal();
  }
}
