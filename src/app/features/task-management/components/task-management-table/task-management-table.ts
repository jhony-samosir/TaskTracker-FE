import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-management-table',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './task-management-table.html',
  styleUrl: './task-management-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskManagementTable {
  readonly tasks = input.required<Task[]>();
  readonly viewTask = output<Task>();
  readonly editTask = output<Task>();

  protected readonly displayedColumns = [
    'title',
    'assignee',
    'status',
    'priority',
    'deadline',
    'actions',
  ];

  protected isOverdue(task: Task): boolean {
    if (task.status === 'CLEARED') return false;
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
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

  protected getStatusLabel(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
}
