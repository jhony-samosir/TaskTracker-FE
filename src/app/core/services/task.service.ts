import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, delay, finalize, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';
import { ApiResponse } from './auth.service';

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: 'deadline' | 'newest' | 'priority';
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;
  private readonly tasksSignal = signal<Task[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly tasks = this.tasksSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadMyTasks(filters: TaskFilters = {}): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.getMyTasks(filters)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (tasks) => this.tasksSignal.set(tasks),
        error: (error: unknown) => this.errorSignal.set(this.getErrorMessage(error)),
      });
  }

  getMyTasks(filters: TaskFilters = {}): Observable<Task[]> {
    const params = this.buildParams(filters);

    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/my`, { params }).pipe(
      tap((response) => {
        if (!response.succeeded) {
          throw new Error(response.message || 'Failed to load tasks.');
        }
      }),
      // Backend task endpoints are not available yet; mock fallback keeps the UI usable.
      catchError(() => of(this.getMockTasks()).pipe(delay(350))),
      tap((response) => {
        if (Array.isArray(response)) {
          return;
        }
      }),
      // Normalize mocked and API data into Task[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tap(() => undefined),
      // Keep this map inline to avoid over-abstracting a tiny adapter.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (source: Observable<ApiResponse<Task[]> | Task[]>) =>
        new Observable<Task[]>((observer) =>
          source.subscribe({
            next: (response) => {
              const tasks = Array.isArray(response) ? response : response.data;
              observer.next(this.applyLocalFilters(tasks, filters));
            },
            error: (error) => observer.error(error),
            complete: () => observer.complete(),
          }),
        ),
    );
  }

  updateTaskStatus(taskId: number, status: TaskStatus): Observable<Task> {
    const previousTasks = this.tasksSignal();
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );

    return this.http
      .put<
        ApiResponse<Task>
      >(`${this.apiUrl}/${taskId}/status`, { status } satisfies UpdateTaskStatusRequest)
      .pipe(
        // Backend task endpoints are not available yet; mock fallback keeps optimistic flow testable.
        catchError(() =>
          of({
            succeeded: true,
            message: 'Task status updated.',
            data: this.findTask(taskId, status),
          }).pipe(delay(250)),
        ),
        tap((response) => {
          if (!response.succeeded) {
            throw new Error(response.message || 'Failed to update task status.');
          }
          this.tasksSignal.update((tasks) =>
            tasks.map((task) => (task.id === taskId ? { ...task, ...response.data } : task)),
          );
        }),
        catchError((error: unknown) => {
          this.tasksSignal.set(previousTasks);
          this.errorSignal.set(this.getErrorMessage(error));
          return throwError(() => error);
        }),
        finalize(() => this.savingSignal.set(false)),
        (source: Observable<ApiResponse<Task>>) =>
          new Observable<Task>((observer) =>
            source.subscribe({
              next: (response) => observer.next(response.data),
              error: (error) => observer.error(error),
              complete: () => observer.complete(),
            }),
          ),
      );
  }

  private buildParams(filters: TaskFilters): HttpParams {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);

    return params;
  }

  private findTask(taskId: number, status: TaskStatus): Task {
    const task = this.tasksSignal().find((item) => item.id === taskId);
    if (!task) {
      throw new Error('Task not found.');
    }

    return { ...task, status };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong. Please try again.';
  }

  private applyLocalFilters(tasks: Task[], filters: TaskFilters): Task[] {
    let filteredTasks = [...tasks];

    if (filters.search?.trim()) {
      const query = filters.search.trim().toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.comment?.toLowerCase().includes(query),
      );
    }

    if (filters.status) {
      filteredTasks = filteredTasks.filter((task) => task.status === filters.status);
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter((task) => task.priority === filters.priority);
    }

    return filteredTasks.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
        case 'priority':
          return this.priorityRank(b.priority) - this.priorityRank(a.priority);
        case 'deadline':
        default:
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
    });
  }

  private priorityRank(priority: TaskPriority = 'LOW'): number {
    const rank: Record<TaskPriority, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      URGENT: 4,
    };

    return rank[priority];
  }

  private getMockTasks(): Task[] {
    return [
      {
        id: 1,
        title: 'Fix login validation errors',
        assigneeId: 10,
        assigneeName: 'Alex Mercer',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-06-05',
        createdAt: '2026-05-25T09:30:00Z',
        document: 'login-validation.pdf',
        attachments: ['login-validation.pdf'],
        comment: 'Need to check frontend and backend validation.',
        description: 'Resolve validation state mismatch between login form and API responses.',
        priority: 'HIGH',
        status: 'ON_PROGRESS',
        history: [
          {
            id: 1,
            type: 'STATUS_CHANGE',
            message: 'Moved to On Progress',
            authorName: 'Alex Mercer',
            createdAt: '2026-05-31T08:00:00Z',
          },
          {
            id: 2,
            type: 'COMMENT',
            message: 'Backend error banner already implemented.',
            authorName: 'Admin User',
            createdAt: '2026-05-31T09:15:00Z',
          },
        ],
      },
      {
        id: 2,
        title: 'Update user profile page',
        assigneeId: 10,
        assigneeName: 'Alex Mercer',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-06-03',
        createdAt: '2026-05-29T11:00:00Z',
        description: 'Improve profile information density and responsive layout.',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
      },
      {
        id: 3,
        title: 'Prepare release notes for v2.1',
        assigneeId: 11,
        assigneeName: 'Sarah Connor',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-06-10',
        createdAt: '2026-05-27T13:45:00Z',
        document: 'release-notes-v2.1.docx',
        attachments: ['release-notes-v2.1.docx'],
        comment: 'Include all new features and bug fixes.',
        description: 'Draft release notes with screenshots and migration notes.',
        priority: 'LOW',
        status: 'NEED_REVIEW',
      },
      {
        id: 4,
        title: 'Database migration script',
        assigneeId: 12,
        assigneeName: 'John Doe',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-05-30',
        createdAt: '2026-05-26T16:30:00Z',
        document: 'migration-v2.1.sql',
        attachments: ['migration-v2.1.sql'],
        description: 'Convert audit date columns to timestamp with time zone.',
        priority: 'URGENT',
        status: 'NEED_REVISION',
      },
      {
        id: 5,
        title: 'Code review for auth module',
        assigneeId: 13,
        assigneeName: 'Emily Watson',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-06-01',
        createdAt: '2026-05-24T10:10:00Z',
        comment: 'Looks good, approve when ready.',
        description: 'Review JWT refresh-token implementation and route guard behavior.',
        priority: 'HIGH',
        status: 'CLEARED',
      },
    ];
  }
}
