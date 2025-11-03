import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models';

/**
 * Service for managing tasks (CRUD operations)
 */
@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/Task`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new task
   */
  createTask(task: CreateTaskDto): Observable<Task> {
    // Transform to backend format (camelCase - ASP.NET Core default)
    const backendTask: any = {
      title: task.title,
      description: task.description || '',
      slot: Number(task.slot), // Ensure slot is a number, not string
    };

    // Add taskDate if provided (use local date format to avoid timezone shift)
    if (task.taskDate) {
      backendTask.taskDate = this.formatDateLocal(task.taskDate) + 'T00:00:00';
    }

    return this.http
      .post<any>(this.apiUrl, backendTask)
      .pipe(map((response) => this.transformTaskResponse(response)));
  }

  /**
   * Get all tasks for a specific date
   * @param date The date to fetch tasks for
   */
  getTasksByDate(date: Date): Observable<Task[]> {
    // Format date as YYYY-MM-DD in local timezone (avoid UTC conversion)
    const dateStr = this.formatDateLocal(date);
    return this.http
      .get<any[]>(`${this.apiUrl}/by-date/${dateStr}`)
      .pipe(map((tasks) => tasks.map((task) => this.transformTaskResponse(task))));
  }

  /**
   * Get a single task by ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.transformTaskResponse(response)));
  }

  /**
   * Update an existing task
   */
  updateTask(id: string, updates: UpdateTaskDto): Observable<Task> {
    // Transform to backend format (camelCase - ASP.NET Core default)
    const backendUpdates: any = {};
    if (updates.title !== undefined) backendUpdates.title = updates.title;
    if (updates.description !== undefined) backendUpdates.description = updates.description;
    if (updates.slot !== undefined) backendUpdates.slot = Number(updates.slot); // Ensure slot is a number, not string
    if (updates.isCompleted !== undefined) backendUpdates.isCompleted = updates.isCompleted;
    if (updates.taskDate !== undefined) {
      backendUpdates.taskDate = updates.taskDate
        ? this.formatDateLocal(updates.taskDate) + 'T00:00:00'
        : null;
    }

    console.log('Sending update to backend:', backendUpdates);

    return this.http
      .put<any>(`${this.apiUrl}/${id}`, backendUpdates)
      .pipe(map((response) => this.transformTaskResponse(response)));
  }

  /**
   * Toggle task completion status
   */
  toggleTaskComplete(id: string): Observable<Task> {
    return this.http
      .patch<any>(`${this.apiUrl}/${id}/toggle`, {})
      .pipe(map((response) => this.transformTaskResponse(response)));
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Format date as YYYY-MM-DD in local timezone (avoid UTC conversion)
   */
  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Transform backend response to match frontend model
   * Handles camelCase conversion and date parsing
   */
  private transformTaskResponse(response: any): Task {
    return {
      id: response.id,
      title: response.title,
      description: response.description || '',
      createdAt: new Date(response.createdAt),
      taskDate: response.taskDate ? new Date(response.taskDate) : undefined,
      isCompleted: response.isCompleted,
      slot: response.slot,
      applicationUserId: response.applicationUserId,
    };
  }
}
