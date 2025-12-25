import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, UpdateTaskDto } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { PrayerTimeSlot } from '../../models/prayer-time-slot.enum';

@Component({
  selector: 'app-daily-review-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-review-modal.component.html',
  styleUrls: ['./daily-review-modal.component.css'],
})
export class DailyReviewModalComponent {
  @Input() tasks: Task[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<void>();

  private taskService = inject(TaskService);
  PrayerTimeSlot = PrayerTimeSlot;

  moveToToday(task: Task) {
    const today = new Date();
    const updateDto: UpdateTaskDto = {
      taskDate: today,
      slot: task.slot,
    };
    this.taskService.updateTask(task.id, updateDto).subscribe(() => {
      this.removeTask(task);
      this.taskUpdated.emit();
    });
  }

  moveToBacklog(task: Task) {
    const updateDto: any = {
      taskDate: null,
      slot: task.slot,
    };
    this.taskService.updateTask(task.id, updateDto).subscribe(() => {
      this.removeTask(task);
      this.taskUpdated.emit();
    });
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id).subscribe(() => {
      this.removeTask(task);
      this.taskUpdated.emit();
    });
  }

  private removeTask(task: Task) {
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    if (this.tasks.length === 0) {
      this.close.emit();
    }
  }
}
