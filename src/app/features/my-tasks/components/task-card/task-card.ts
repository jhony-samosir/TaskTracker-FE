import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task, TaskStatus } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly selected = output<Task>();
  readonly statusChange = output<{ task: Task; status: TaskStatus }>();

  readonly statusColors: Record<TaskStatus, string> = {
    ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
    ON_PROGRESS: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    NEED_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
    NEED_REVISION: 'bg-rose-50 text-rose-700 border border-rose-200',
    CLEARED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  protected selectTask(): void {
    this.selected.emit(this.task());
  }

  protected updateStatus(event: MouseEvent, status: TaskStatus): void {
    event.stopPropagation();
    this.statusChange.emit({ task: this.task(), status });
  }

  protected formatStatus(status: TaskStatus): string {
    return status.replace(/_/g, ' ');
  }

  protected getStatusClass(status: TaskStatus): string {
    return this.statusColors[status] ?? 'bg-slate-50 text-slate-700 border border-slate-200';
  }

  protected isOverdue(deadline: string): boolean {
    return new Date(deadline).getTime() < new Date().setHours(0, 0, 0, 0);
  }
}