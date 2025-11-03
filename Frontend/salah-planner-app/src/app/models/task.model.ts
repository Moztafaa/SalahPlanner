import { PrayerTimeSlot } from './prayer-time-slot.enum';

/**
 * Task data model matching TaskDto from backend
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  taskDate?: Date;
  isCompleted: boolean;
  slot: PrayerTimeSlot;
  applicationUserId?: string;
}

/**
 * DTO for creating a new task matching CreateTaskDto from backend
 */
export interface CreateTaskDto {
  title: string;
  description?: string;
  slot: PrayerTimeSlot;
  taskDate?: Date;
}

/**
 * DTO for updating a task matching UpdateTaskDto from backend
 */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  slot?: PrayerTimeSlot;
  isCompleted?: boolean;
  taskDate?: Date;
}
