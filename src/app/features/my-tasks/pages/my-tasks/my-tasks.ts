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
import { TaskFilters, TaskService } from '../../../../core/services/task.service';
import { TaskBoardComponent } from '../../components/task-board/task-board';
import {
  TaskDetailDialogData,
  TaskDetailDrawerComponent,
} from '../../components/task-detail-drawer/task-detail-drawer';
import { TaskFilterComponent, TaskFilterValues } from '../../components/task-filter/task-filter';

@Component({
  selector: 'app-my-tasks',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TaskBoardComponent,
    TaskFilterComponent,
  ],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTasks implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  protected readonly taskService = inject(TaskService);

  protected readonly tasks = this.taskService.tasks;
  protected readonly loading = this.taskService.loading;
  protected readonly saving = this.taskService.saving;
  protected readonly error = this.taskService.error;
  private readonly filterValuesSignal = signal<TaskFilterValues>({
    search: '',
    status: '',
    priority: '',
    sortBy: 'deadline',
  });
  protected readonly filterValues = this.filterValuesSignal.asReadonly();

  protected readonly statusCounts = computed<Record<string, number>>(() => {
    return this.tasks().reduce<Record<string, number>>((acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    }, {});
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const sortBy = params.get('sortBy');
      const filters: TaskFilterValues = {
        search: params.get('search') ?? '',
        status: (params.get('status') as TaskStatus | null) ?? '',
        priority: (params.get('priority') as TaskPriority | null) ?? '',
        sortBy: sortBy === 'newest' || sortBy === 'priority' ? sortBy : 'deadline',
      };

      this.filterValuesSignal.set(filters);
      this.taskService.loadMyTasks({
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        sortBy: filters.sortBy,
      });
    });
  }

  protected onFilterChange(filters: TaskFilterValues): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: filters.search || null,
        status: filters.status || null,
        priority: filters.priority || null,
        sortBy: filters.sortBy === 'deadline' ? null : filters.sortBy,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected openTask(task: Task): void {
    const dialogRef = this.dialog.open<TaskDetailDrawerComponent, TaskDetailDialogData, TaskStatus>(
      TaskDetailDrawerComponent,
      {
        width: 'min(720px, 100vw)',
        maxWidth: '100vw',
        height: '100vh',
        position: { right: '0' },
        autoFocus: 'dialog',
        restoreFocus: true,
        panelClass: 'task-detail-drawer-panel',
        data: { task },
      },
    );

    dialogRef.afterClosed().subscribe((status) => {
      if (status) {
        this.updateStatus({ task, status });
      }
    });
  }

  protected updateStatus(event: { task: Task; status: TaskStatus }): void {
    this.taskService.updateTaskStatus(event.task.id, event.status).subscribe();
  }

  protected reload(): void {
    this.taskService.loadMyTasks(this.currentFilters());
  }

  private currentFilters(): TaskFilters {
    const filters = this.filterValues();
    return {
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      sortBy: filters.sortBy,
    };
  }
}
