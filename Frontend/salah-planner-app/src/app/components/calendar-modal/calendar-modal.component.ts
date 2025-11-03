import { Component, EventEmitter, Input, Output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dayNumber: number;
}

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-modal.component.html',
  styleUrls: ['./calendar-modal.component.css'],
})
export class CalendarModalComponent {
  @Input() currentSelectedDate?: Date; // Currently selected date from parent
  @Output() close = new EventEmitter<void>();
  @Output() dateSelected = new EventEmitter<Date>();

  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  today = new Date();

  constructor() {
    // Initialize selectedDate when component receives currentSelectedDate
    effect(() => {
      if (this.currentSelectedDate) {
        this.selectedDate.set(this.currentSelectedDate);
        // Also set the calendar to show the month of the selected date
        this.currentDate.set(
          new Date(this.currentSelectedDate.getFullYear(), this.currentSelectedDate.getMonth(), 1)
        );
      }
    });
  }

  // Get month name
  monthName = computed(() => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[this.currentDate().getMonth()];
  });

  // Get year
  year = computed(() => {
    return this.currentDate().getFullYear();
  });

  // Generate calendar days for the current month view
  calendarDays = computed(() => {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();
    const lastDayDate = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, this.today),
        isSelected: this.selectedDate() ? this.isSameDay(date, this.selectedDate()!) : false,
        dayNumber: date.getDate(),
      });
    }

    // Add days from current month
    for (let i = 1; i <= lastDayDate; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, this.today),
        isSelected: this.selectedDate() ? this.isSameDay(date, this.selectedDate()!) : false,
        dayNumber: i,
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, this.today),
        isSelected: this.selectedDate() ? this.isSameDay(date, this.selectedDate()!) : false,
        dayNumber: i,
      });
    }

    return days;
  });

  // Days of week labels
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  /**
   * Go to today's date
   */
  goToToday(): void {
    this.currentDate.set(new Date());
  }

  /**
   * Select a date and emit event
   */
  selectDate(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    this.dateSelected.emit(day.date);
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Handle backdrop click to close
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
