import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task, TaskStatus } from '../../../../core/models/task.model';

export interface TaskDetailDialogData {
  task: Task;
}

@Component({
  selector: 'app-task-detail-drawer',
  templateUrl: './task-detail-drawer.html',
  styleUrl: './task-detail-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
})
export class TaskDetailDrawerComponent {
  readonly statusColors: Record<TaskStatus, string> = {
    ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
    ON_PROGRESS: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    NEED_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
    NEED_REVISION: 'bg-rose-50 text-rose-700 border border-rose-200',
    CLEARED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  constructor(
    public dialogRef: MatDialogRef<TaskDetailDrawerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDetailDialogData,
  ) {}

  protected formatStatus(status: TaskStatus): string {
    return status.replace(/_/g, ' ');
  }

  protected getStatusClass(status: TaskStatus): string {
    return this.statusColors[status] ?? 'bg-slate-50 text-slate-700 border border-slate-200';
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected updateStatus(status: TaskStatus): void {
    this.dialogRef.close(status);
  }
}
