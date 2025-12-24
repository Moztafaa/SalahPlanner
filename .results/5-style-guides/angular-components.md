# Style Guide: Angular Components

## Unique Conventions for SalahPlanner Angular Components

### 1. Standalone Component Structure

All components must use `standalone: true` with explicit imports:

**✅ Correct Pattern:**
```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,          // For *ngIf, *ngFor, etc.
    DragDropModule,        // For drag-and-drop
    TaskFormComponent,     // Child components
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

**❌ Avoid:**
```typescript
// Don't use NgModule-based components
@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule]
})
export class DashboardModule { }
```

### 2. Signal-Based State Management

Use Angular signals for reactive component state:

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  // Signal state (mutable)
  prayerTimes = signal<PrayerTimes | null>(null);
  tasks = signal<Task[]>([]);
  selectedDate = signal<Date>(new Date());
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Computed state (derived from signals)
  nextSalahInfo = computed(() => this.calculateNextSalah());
  hijriDate = computed(() => moment(this.selectedDate()).format('iYYYY/iMM/iDD'));

  // Observables for service calls
  private subscriptions: Subscription[] = [];
}
```

**Update signals:**
```typescript
// Set entire value
this.isLoading.set(true);
this.tasks.set(newTasks);

// Update based on current value
this.tasks.update(tasks => [...tasks, newTask]);
```

**Use in templates:**
```html
<p>Loading: {{ isLoading() }}</p>
<p>Task count: {{ tasks().length }}</p>
<p>Next Salah: {{ nextSalahInfo().name }}</p>
```

### 3. Service Injection Pattern

Use constructor injection for services:

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private authService: AuthService,
    private prayerTimeService: PrayerTimeService,
    private taskService: TaskService,
    private router: Router
  ) {}
}
```

Or use `inject()` function:
```typescript
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
}
```

### 4. Lifecycle Hooks Pattern

Implement OnInit for initialization and OnDestroy for cleanup:

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadPrayerTimes();
    this.loadTasks();

    // Subscribe to observables
    const taskSub = this.taskService.tasks$.subscribe(tasks => {
      this.tasks.set(tasks);
    });
    this.subscriptions.push(taskSub);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### 5. Reactive Forms Pattern

Use `FormBuilder` to create reactive forms:

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

**Template binding:**
```html
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <input type="email" formControlName="email" />
  <input type="password" formControlName="password" />

  <div *ngIf="errorMessage()" class="alert alert-danger">
    {{ errorMessage() }}
  </div>

  <button type="submit" [disabled]="loginForm.invalid || isLoading()">
    {{ isLoading() ? 'Logging in...' : 'Login' }}
  </button>
</form>
```

### 6. Component Communication

**Parent to Child (@Input):**
```typescript
// Child component
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Input() isOpen = false;

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        slot: this.task.slot
      });
    }
  }
}

// Parent template
<app-task-form [task]="selectedTask()" [isOpen]="showTaskForm()"></app-task-form>
```

**Child to Parent (@Output):**
```typescript
// Child component
export class TaskFormComponent {
  @Output() taskSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onSubmit(): void {
    // Save task logic
    this.taskSaved.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

// Parent template
<app-task-form
  (taskSaved)="onTaskSaved()"
  (cancelled)="onFormCancelled()">
</app-task-form>
```

### 7. Drag-and-Drop Pattern

Use Angular CDK for drag-and-drop:

```typescript
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  imports: [DragDropModule, CommonModule]
})
export class DashboardComponent {
  onTaskDrop(event: CdkDragDrop<Task[]>, targetSlot: PrayerTimeSlot): void {
    if (event.previousContainer === event.container) {
      // Reorder within same list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move between lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update backend
      const movedTask = event.container.data[event.currentIndex];
      this.taskService.updateTask(movedTask.id, {
        title: movedTask.title,
        slot: targetSlot,
        description: movedTask.description
      }).subscribe();
    }
  }
}
```

**Template:**
```html
<div cdkDropList
     [cdkDropListData]="tasks"
     [cdkDropListConnectedTo]="connectedLists"
     (cdkDropListDropped)="onTaskDrop($event, slot)">
  <div *ngFor="let task of tasks" cdkDrag class="task-card">
    {{ task.title }}
  </div>
</div>
```

### 8. Computed Values Pattern

Use `computed()` for derived state:

```typescript
export class DashboardComponent {
  tasks = signal<Task[]>([]);

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

  // Next prayer calculation
  nextSalahInfo = computed(() => {
    const prayers = this.prayerTimes();
    if (!prayers) return null;

    const now = new Date();
    // Logic to find next prayer
    return { name: 'Asr', time: prayers.asr, timestamp: asrTime };
  });
}
```

### 9. Template Syntax Conventions

**Structural Directives:**
```html
<!-- Always use with * prefix -->
<div *ngIf="isLoggedIn()">Welcome</div>
<div *ngFor="let task of tasks(); trackBy: trackByTaskId">{{ task.title }}</div>

<!-- Use ng-container for non-rendering wrapper -->
<ng-container *ngIf="prayerTimes()">
  <div>{{ prayerTimes().fajr }}</div>
</ng-container>
```

**Property Binding:**
```html
<!-- Square brackets for property binding -->
<input [value]="taskTitle()" />
<div [class.active]="isActive()" [style.color]="taskColor()">Content</div>
<img [src]="imageUrl()" [alt]="imageAlt()" />
```

**Event Binding:**
```html
<!-- Parentheses for event binding -->
<button (click)="saveTask()">Save</button>
<input (input)="onSearchChange($event)" />
<form (submit)="onSubmit()">Submit</form>
```

**Two-Way Binding:**
```html
<!-- Banana-in-a-box syntax -->
<input [(ngModel)]="searchText" />
```

### 10. TypeScript Typing

Always use explicit types for component properties:

```typescript
export class DashboardComponent implements OnInit {
  // Typed signals
  prayerTimes = signal<PrayerTimes | null>(null);
  tasks = signal<Task[]>([]);
  selectedDate = signal<Date>(new Date());

  // Typed properties
  private subscriptions: Subscription[] = [];

  // Typed method parameters and return types
  loadTasks(date: Date): void {
    this.taskService.getTasksByDate(date).subscribe({
      next: (tasks: Task[]) => {
        this.tasks.set(tasks);
      },
      error: (err: any) => {
        console.error('Error loading tasks:', err);
      }
    });
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
```

### 11. File Organization

Each component has exactly 3 or 4 files:

```
dashboard/
├── dashboard.component.ts       # Component logic
├── dashboard.component.html     # Template
├── dashboard.component.css      # Styles
└── dashboard.component.spec.ts  # Tests (optional)
```

### 12. Component Selector Naming

Use `app-` prefix for all component selectors:

```typescript
@Component({
  selector: 'app-dashboard',      // ✅
  selector: 'app-task-form',      // ✅
  selector: 'app-calendar-modal', // ✅
})
```

### 13. Subscription Management Pattern

Always unsubscribe from observables to prevent memory leaks:

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Method 1: Push to array
    const taskSub = this.taskService.tasks$.subscribe(tasks => {
      this.tasks.set(tasks);
    });
    this.subscriptions.push(taskSub);

    // Method 2: Store individual subscriptions
    this.prayerSub = this.prayerTimeService.prayerTimes$.subscribe(...);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### 14. Moment Hijri Integration

Use moment-hijri for Islamic calendar:

```typescript
import moment from 'moment-hijri';

export class CalendarModalComponent {
  selectedDate = signal<Date>(new Date());

  // Computed Hijri date
  hijriDate = computed(() => {
    return moment(this.selectedDate()).format('iYYYY/iMM/iDD');
  });

  // Display both Gregorian and Hijri
  dateDisplay = computed(() => {
    const date = this.selectedDate();
    const gregorian = moment(date).format('MMMM D, YYYY');
    const hijri = moment(date).format('iMMMM iD, iYYYY');
    return { gregorian, hijri };
  });
}
```

### 15. Error Handling Pattern

Display user-friendly errors using signals:

```typescript
export class LoginComponent {
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);  // Clear previous errors

    this.authService.login(this.loginForm.value as LoginDto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error.message || 'An error occurred');
      }
    });
  }
}
```

**Template:**
```html
<div *ngIf="errorMessage()" class="alert alert-danger">
  {{ errorMessage() }}
</div>
```

## Summary of Key Patterns

1. Use `standalone: true` for all components
2. Manage state with Angular signals (`signal()`, `computed()`)
3. Inject services via constructor
4. Implement OnInit/OnDestroy for lifecycle management
5. Unsubscribe from observables in OnDestroy
6. Use FormBuilder for reactive forms
7. Use @Input/@Output for parent-child communication
8. Import Angular CDK for drag-and-drop
9. Use explicit TypeScript types
10. Maintain 3-4 file structure per component
11. Prefix selectors with `app-`
12. Handle errors with signal-based error messages
13. Use moment-hijri for Islamic calendar
14. Use trackBy functions for *ngFor performance
