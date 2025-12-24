# UI Components Domain

## Overview

The frontend uses Angular 20 standalone components with signal-based reactivity, Bootstrap styling, and Angular CDK for advanced UI behaviors.

## Component Architecture

### Standalone Components Pattern

All components use `standalone: true` (no NgModules):

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TaskFormComponent,
    SettingsFormComponent,
    CalendarModalComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Component logic
}
```

## Core Components

### 1. DashboardComponent

**Location**: `Frontend/salah-planner-app/src/app/components/dashboard/dashboard.component.ts`

**Purpose**: Main application view showing prayer times and tasks

**State Management**:
```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  // Signal-based reactive state
  prayerTimes = signal<PrayerTimes | null>(null);
  tasks = signal<Task[]>([]);
  selectedDate = signal<Date>(new Date());

  // Computed values
  nextSalahInfo = computed(() => this.calculateNextSalah());

  // Observable subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private prayerTimeService: PrayerTimeService,
    private taskService: TaskService,
    private router: Router
  ) {}
}
```

**Task Grouping**:
```typescript
// Group tasks by prayer time slot
groupedTasks = computed(() => {
  const allTasks = this.tasks();

  return [
    {
      slot: PrayerTimeSlot.Fajr,
      displayName: 'Fajr',
      tasks: allTasks.filter(t => t.slot === PrayerTimeSlot.Fajr),
      cssClass: 'fajr'
    },
    {
      slot: PrayerTimeSlot.Dhuhr,
      displayName: 'Dhuhr',
      tasks: allTasks.filter(t => t.slot === PrayerTimeSlot.Dhuhr),
      cssClass: 'dhuhr'
    },
    // ... other prayer times
  ];
});
```

**Drag-and-Drop**:
```typescript
onTaskDrop(event: CdkDragDrop<Task[]>, targetSlot: PrayerTimeSlot): void {
  const movedTask = event.previousContainer.data[event.previousIndex];

  if (event.previousContainer === event.container) {
    // Reorder within same list
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    // Move between lists
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update task slot
    this.taskService.updateTask(movedTask.id, {
      title: movedTask.title,
      slot: targetSlot,
      description: movedTask.description,
      taskDate: movedTask.taskDate
    }).subscribe({
      next: (updatedTask) => {
        movedTask.slot = updatedTask.slot;
        this.tasks.set([...this.tasks()]);
      }
    });
  }
}
```

**Template Example** (dashboard.component.html):
```html
<!-- Prayer Times Header -->
<div class="prayer-times-header">
  <div class="prayer-time" *ngFor="let prayer of prayerTimesList()">
    <span class="prayer-name">{{ prayer.name }}</span>
    <span class="prayer-time-value">{{ prayer.time }}</span>
  </div>
</div>

<!-- Task Lists by Prayer Time -->
<div class="task-columns">
  <div *ngFor="let group of groupedTasks()"
       class="prayer-column {{ group.cssClass }}">
    <h3>{{ group.displayName }}</h3>

    <div cdkDropList
         [cdkDropListData]="group.tasks"
         (cdkDropListDropped)="onTaskDrop($event, group.slot)"
         class="task-list">
      <div *ngFor="let task of group.tasks"
           cdkDrag
           class="task-card"
           [class.completed]="task.isCompleted">
        <div class="task-content">
          <h4>{{ task.title }}</h4>
          <p *ngIf="task.description">{{ task.description }}</p>
        </div>
        <div class="task-actions">
          <button (click)="toggleTask(task)">
            {{ task.isCompleted ? 'Undo' : 'Complete' }}
          </button>
          <button (click)="deleteTask(task.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 2. LoginComponent

**Location**: `Frontend/salah-planner-app/src/app/components/login/login.component.ts`

**Purpose**: User authentication form

**Reactive Form**:
```typescript
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.authService.login(this.loginForm.value as LoginDto).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error.message || 'Login failed');
        }
      });
    }
  }
}
```

**Template** (login.component.html):
```html
<div class="login-container">
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
    <h2>Login to Salah Planner</h2>

    <div class="form-group">
      <label for="email">Email</label>
      <input id="email"
             type="email"
             formControlName="email"
             class="form-control"
             placeholder="Enter your email">
      <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
        <small class="text-danger">Valid email is required</small>
      </div>
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input id="password"
             type="password"
             formControlName="password"
             class="form-control"
             placeholder="Enter your password">
      <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
        <small class="text-danger">Password is required</small>
      </div>
    </div>

    <div *ngIf="errorMessage()" class="alert alert-danger">
      {{ errorMessage() }}
    </div>

    <button type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="btn btn-primary">
      {{ isLoading() ? 'Logging in...' : 'Login' }}
    </button>
  </form>
</div>
```

### 3. TaskFormComponent

**Location**: `Frontend/salah-planner-app/src/app/components/task-form/task-form.component.ts`

**Purpose**: Modal form for creating/editing tasks

**Inputs and Outputs**:
```typescript
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Output() taskSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    slot: [PrayerTimeSlot.Fajr, Validators.required],
    taskDate: [new Date()]
  });

  prayerSlots = [
    { value: PrayerTimeSlot.Fajr, label: 'Fajr' },
    { value: PrayerTimeSlot.Dhuhr, label: 'Dhuhr' },
    { value: PrayerTimeSlot.Asr, label: 'Asr' },
    { value: PrayerTimeSlot.Maghrib, label: 'Maghrib' },
    { value: PrayerTimeSlot.Isha, label: 'Isha' }
  ];

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        slot: this.task.slot,
        taskDate: this.task.taskDate
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;

      if (this.task) {
        // Update existing task
        this.taskService.updateTask(this.task.id, formValue as UpdateTaskDto)
          .subscribe(() => {
            this.taskSaved.emit();
          });
      } else {
        // Create new task
        this.taskService.createTask(formValue as CreateTaskDto)
          .subscribe(() => {
            this.taskSaved.emit();
          });
      }
    }
  }
}
```

### 4. CalendarModalComponent

**Location**: `Frontend/salah-planner-app/src/app/components/calendar-modal/calendar-modal.component.ts`

**Purpose**: Date picker for viewing different days

**Hijri Calendar Integration**:
```typescript
export class CalendarModalComponent {
  @Input() currentDate!: Date;
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() closed = new EventEmitter<void>();

  selectedDate = signal<Date>(new Date());
  hijriDate = computed(() => {
    return moment(this.selectedDate()).format('iYYYY/iMM/iDD');
  });

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  confirmSelection(): void {
    this.dateSelected.emit(this.selectedDate());
    this.closed.emit();
  }
}
```

## Component Patterns

### 1. Signal-Based State

Use Angular signals for reactive local state:
```typescript
// Mutable state
const count = signal(0);
count.set(5);
count.update(n => n + 1);

// Computed derived state
const doubled = computed(() => count() * 2);

// In template
<p>Count: {{ count() }}</p>
<p>Doubled: {{ doubled() }}</p>
```

### 2. Service Injection

Use `inject()` function or constructor injection:
```typescript
// Function-based injection
export class MyComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
}

// Constructor injection
export class MyComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
}
```

### 3. Lifecycle Hooks

Implement OnInit for initialization, OnDestroy for cleanup:
```typescript
export class MyComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    const sub = this.taskService.getTasks().subscribe(tasks => {
      this.tasks.set(tasks);
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### 4. Template Syntax

Common Angular template patterns:
```html
<!-- Property binding -->
<input [value]="taskTitle()" />

<!-- Event binding -->
<button (click)="saveTask()">Save</button>

<!-- Two-way binding -->
<input [(ngModel)]="searchText" />

<!-- Structural directives -->
<div *ngIf="isLoggedIn()">Welcome</div>
<div *ngFor="let task of tasks()">{{ task.title }}</div>

<!-- Class binding -->
<div [class.active]="isActive()">Content</div>

<!-- Style binding -->
<div [style.color]="taskColor()">Task</div>

<!-- Template references -->
<input #taskInput type="text" />
<button (click)="processInput(taskInput.value)">Submit</button>
```

### 5. Reactive Forms

Build forms with FormBuilder:
```typescript
taskForm = this.fb.group({
  title: ['', [Validators.required, Validators.maxLength(100)]],
  description: ['', Validators.maxLength(500)],
  slot: [PrayerTimeSlot.Fajr, Validators.required]
});

// Access form controls
get titleControl() {
  return this.taskForm.get('title');
}

// Check validity
if (this.taskForm.valid) {
  const formValue = this.taskForm.value;
}

// Patch values
this.taskForm.patchValue({
  title: task.title,
  slot: task.slot
});
```

### 6. Component Communication

**Parent → Child** (Input):
```typescript
// Child component
@Input() task!: Task;

// Parent template
<app-task-form [task]="selectedTask()"></app-task-form>
```

**Child → Parent** (Output):
```typescript
// Child component
@Output() taskSaved = new EventEmitter<void>();

onSubmit() {
  this.taskSaved.emit();
}

// Parent template
<app-task-form (taskSaved)="onTaskSaved()"></app-task-form>
```

## Styling

### Component-Scoped CSS

Each component has its own CSS file:
```css
/* dashboard.component.css */
.task-columns {
  display: flex;
  gap: 1rem;
}

.prayer-column {
  flex: 1;
  min-width: 200px;
}

.task-card {
  background: white;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: move;
}

.task-card.completed {
  opacity: 0.6;
  text-decoration: line-through;
}
```

### Bootstrap Integration

Use Bootstrap classes in templates:
```html
<div class="container">
  <div class="row">
    <div class="col-md-6">
      <button class="btn btn-primary">Save</button>
    </div>
  </div>
</div>
```

### Global Styles

Global styles in `src/styles.css`:
```css
:root {
  --primary-color: #2c5f4f;
  --secondary-color: #d4a574;
  --background-color: #f5f1e8;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--background-color);
}
```

## Angular CDK Usage

### Drag and Drop

Import CdkDragDrop module and use directives:
```typescript
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  imports: [DragDropModule, CommonModule],
  // ...
})
```

```html
<div cdkDropList
     [cdkDropListData]="tasks"
     (cdkDropListDropped)="onDrop($event)">
  <div *ngFor="let task of tasks" cdkDrag>
    {{ task.title }}
  </div>
</div>
```

## File Structure

```
components/
├── dashboard/
│   ├── dashboard.component.ts
│   ├── dashboard.component.html
│   ├── dashboard.component.css
│   └── dashboard.component.spec.ts
├── login/
│   ├── login.component.ts
│   ├── login.component.html
│   └── login.component.css
├── register/
│   ├── register.component.ts
│   ├── register.component.html
│   └── register.component.css
├── task-form/
│   ├── task-form.component.ts
│   ├── task-form.component.html
│   └── task-form.component.css
├── settings-form/
│   └── ...
└── calendar-modal/
    └── ...
```

## Best Practices

1. **Keep components focused**: Each component should have a single responsibility
2. **Use signals for reactive state**: Prefer signals over manual change detection
3. **Unsubscribe from observables**: Prevent memory leaks in OnDestroy
4. **Validate forms**: Use Validators for form validation
5. **Use CSS encapsulation**: Keep styles scoped to components
6. **Extract reusable logic to services**: Don't duplicate logic across components
7. **Use typed models**: Define interfaces for all data structures
8. **Handle errors**: Display user-friendly error messages
