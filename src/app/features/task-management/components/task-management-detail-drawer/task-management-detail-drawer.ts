import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskStatus } from '../../../../core/models/task.model';
import {
  TaskManagementDetailData,
  TaskManagementDetailResult,
} from '../../models/task-management.model';

@Component({
  selector: 'app-task-management-detail-drawer',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './task-management-detail-drawer.html',
  styleUrl: './task-management-detail-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskManagementDetailDrawer {
  protected readonly data = inject<TaskManagementDetailData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<TaskManagementDetailDrawer, TaskManagementDetailResult>,
  );

  protected get task() {
    return this.data.task;
  }

  protected get isOverdue(): boolean {
    if (this.task.status === 'CLEARED') return false;
    return new Date(this.task.deadline) < new Date();
  }

  protected getStatusLabel(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected getStatusClasses(status: string): string {
    const base = 'px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ';
    switch (status) {
      case 'ASSIGNED':
        return base + 'bg-slate-100 text-slate-700';
      case 'ON_PROGRESS':
        return base + 'bg-blue-50 text-blue-700';
      case 'NEED_REVIEW':
        return base + 'bg-amber-50 text-amber-700';
      case 'NEED_REVISION':
        return base + 'bg-rose-50 text-rose-700';
      case 'CLEARED':
        return base + 'bg-emerald-50 text-emerald-700';
      default:
        return base + 'bg-slate-100 text-slate-700';
    }
  }

  protected getPriorityClasses(priority?: string): string {
    const base = 'px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ';
    switch (priority) {
      case 'LOW':
        return base + 'bg-slate-100 text-slate-700';
      case 'MEDIUM':
        return base + 'bg-indigo-50 text-indigo-700';
      case 'HIGH':
        return base + 'bg-orange-50 text-orange-700';
      case 'URGENT':
        return base + 'bg-red-50 text-red-700';
      default:
        return base + 'bg-slate-100 text-slate-700';
    }
  }

  protected getPriorityLabel(priority?: string): string {
    switch (priority) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      case 'URGENT':
        return 'Urgent';
      default:
        return '-';
    }
  }

  protected isAdminReviewAction(currentStatus: string): boolean {
    return currentStatus === 'NEED_REVIEW';
  }

  protected isCleared(): boolean {
    return this.task.status === 'CLEARED';
  }

  protected isRevisable(): boolean {
    return this.task.status === 'NEED_REVIEW';
  }

  protected updateStatus(status: TaskStatus): void {
    const confirmed =
      status === 'NEED_REVISION' || status === 'CLEARED'
        ? window.confirm(
            status === 'CLEARED'
              ? 'Mark this task as Cleared? This is a terminal action.'
              : 'Mark this task as Need Revision? The assignee will need to make changes.',
          )
        : true;

    if (confirmed) {
      this.dialogRef.close({
        action: 'status',
        task: this.task,
        status,
      } satisfies TaskManagementDetailResult);
    }
  }

  protected editTask(): void {
    this.dialogRef.close({
      action: 'edit',
      task: this.task,
    } satisfies TaskManagementDetailResult);
  }

  protected closeDrawer(): void {
    this.dialogRef.close();
  }
}
