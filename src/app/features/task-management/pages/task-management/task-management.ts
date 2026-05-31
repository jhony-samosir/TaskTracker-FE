import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { AuthService } from '../../../../core/services/auth.service';
import {
  CreateTaskRequest,
  TaskFilters,
  TaskService,
  UpdateTaskRequest,
} from '../../../../core/services/task.service';
import { TaskFormDialog } from '../../components/task-form-dialog/task-form-dialog';
import { TaskManagementDetailDrawer } from '../../components/task-management-detail-drawer/task-management-detail-drawer';
import { TaskManagementTable } from '../../components/task-management-table/task-management-table';
import { TaskManagementToolbar } from '../../components/task-management-toolbar/task-management-toolbar';
import {
  TaskFormDialogResult,
  TaskManagementDetailResult,
  TaskManagementFilters,
  TaskManagementMetrics,
  TaskManagementUserOption,
} from '../../models/task-management.model';

@Component({
  selector: 'app-task-management',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TaskManagementTable,
    TaskManagementToolbar,
  ],
  templateUrl: './task-management.html',
  styleUrl: './task-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskManagement implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  protected readonly taskService = inject(TaskService);

  protected readonly tasks = this.taskService.tasks;
  protected readonly loading = this.taskService.loading;
  protected readonly saving = this.taskService.saving;
  protected readonly error = this.taskService.error;
  protected readonly users = signal<TaskManagementUserOption[]>(this.taskService.getMockUsers());

  protected readonly filters = signal<TaskManagementFilters>({
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
    reviewerId: '',
    sortBy: 'deadline',
  });

  protected readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  protected readonly metrics = computed<TaskManagementMetrics>(() => {
    const tasks = this.tasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(today.getDate() + 3);
    return {
      total: tasks.length,
      assigned: tasks.filter((t) => t.status === 'ASSIGNED').length,
      onProgress: tasks.filter((t) => t.status === 'ON_PROGRESS').length,
      needReview: tasks.filter((t) => t.status === 'NEED_REVIEW').length,
      needRevision: tasks.filter((t) => t.status === 'NEED_REVISION').length,
      cleared: tasks.filter((t) => t.status === 'CLEARED').length,
      overdue: tasks.filter((t) => t.status !== 'CLEARED' && new Date(t.deadline) < today).length,
      dueSoon: tasks.filter((t) => {
        const due = new Date(t.deadline);
        return t.status !== 'CLEARED' && due >= today && due <= soon;
      }).length,
    };
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const nextFilters: TaskManagementFilters = {
        search: params.get('search') ?? '',
        status: (params.get('status') as TaskStatus | null) ?? '',
        priority: (params.get('priority') as TaskPriority | null) ?? '',
        assigneeId: params.get('assigneeId') ? Number(params.get('assigneeId')) : '',
        reviewerId: params.get('reviewerId') ? Number(params.get('reviewerId')) : '',
        sortBy: (params.get('sortBy') as TaskFilters['sortBy']) ?? 'deadline',
      };
      this.filters.set(nextFilters);
      this.taskService.loadManagedTasks(this.toServiceFilters(nextFilters));
    });
  }

  protected onFilterChange(filters: TaskManagementFilters): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: filters.search || null,
        status: filters.status || null,
        priority: filters.priority || null,
        assigneeId: filters.assigneeId || null,
        reviewerId: filters.reviewerId || null,
        sortBy: filters.sortBy === 'deadline' ? null : filters.sortBy,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected clearFilters(): void {
    this.onFilterChange({
      search: '',
      status: '',
      priority: '',
      assigneeId: '',
      reviewerId: '',
      sortBy: 'deadline',
    });
  }

  protected reload(): void {
    this.taskService.loadManagedTasks(this.toServiceFilters(this.filters()));
  }

  protected openCreateDialog(): void {
    const ref = this.dialog.open<TaskFormDialog, unknown, TaskFormDialogResult>(TaskFormDialog, {
      width: 'min(760px, 96vw)',
      autoFocus: 'dialog',
      restoreFocus: true,
      data: { mode: 'create', users: this.users() },
    });
    ref.afterClosed().subscribe((result) => this.handleFormResult(result));
  }

  protected openEditDialog(task: Task): void {
    const ref = this.dialog.open<TaskFormDialog, unknown, TaskFormDialogResult>(TaskFormDialog, {
      width: 'min(760px, 96vw)',
      autoFocus: 'dialog',
      restoreFocus: true,
      data: { mode: 'edit', task, users: this.users() },
    });
    ref.afterClosed().subscribe((result) => this.handleFormResult(result));
  }

  protected openDetail(task: Task): void {
    const ref = this.dialog.open<TaskManagementDetailDrawer, unknown, TaskManagementDetailResult>(
      TaskManagementDetailDrawer,
      {
        width: 'min(820px, 96vw)',
        maxWidth: '100vw',
        maxHeight: '90vh',
        autoFocus: 'dialog',
        restoreFocus: true,
        data: { task },
      },
    );
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'edit') this.openEditDialog(result.task);
      if (result.action === 'status' && result.status)
        this.updateStatus(result.task, result.status);
    });
  }

  protected updateStatus(task: Task, status: TaskStatus): void {
    this.taskService.updateTaskStatus(task.id, status).subscribe();
  }

  private handleFormResult(result?: TaskFormDialogResult): void {
    if (!result) return;
    const payload: CreateTaskRequest | UpdateTaskRequest = { ...result.value };
    if (result.mode === 'create') this.taskService.createTask(payload).subscribe();
    if (result.mode === 'edit' && result.taskId)
      this.taskService.updateTask(result.taskId, payload).subscribe();
  }

  private toServiceFilters(filters: TaskManagementFilters): TaskFilters {
    return {
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      assigneeId: filters.assigneeId || undefined,
      reviewerId: filters.reviewerId || undefined,
      sortBy: filters.sortBy,
    };
  }
}
