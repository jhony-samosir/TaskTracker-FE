import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TaskPriority, TaskStatus } from '../../../../core/models/task.model';

export interface TaskFilterValues {
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  sortBy: 'deadline' | 'newest' | 'priority';
}

@Component({
  selector: 'app-task-filter',
  templateUrl: './task-filter.html',
  styleUrl: './task-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, FormsModule],
})
export class TaskFilterComponent {
  readonly filters = input.required<TaskFilterValues>();
  readonly filterChange = output<TaskFilterValues>();
  readonly statusCounts = input<Record<string, number>>({});

  protected search = signal('');
  protected status = signal<TaskStatus | ''>('');
  protected priority = signal<TaskPriority | ''>('');
  protected sortBy = signal<'deadline' | 'newest' | 'priority'>('deadline');

  readonly statusOptions: { value: TaskStatus | ''; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'ON_PROGRESS', label: 'On Progress' },
    { value: 'NEED_REVIEW', label: 'Need Review' },
    { value: 'NEED_REVISION', label: 'Need Revision' },
    { value: 'CLEARED', label: 'Cleared' },
  ];

  readonly priorityOptions: { value: TaskPriority | ''; label: string }[] = [
    { value: '', label: 'All Priorities' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  readonly sortOptions: { value: 'deadline' | 'newest' | 'priority'; label: string }[] = [
    { value: 'deadline', label: 'Due Date' },
    { value: 'newest', label: 'Newest' },
    { value: 'priority', label: 'Priority' },
  ];

  constructor() {
    effect(() => {
      const f = this.filters();
      this.search.set(f.search);
      this.status.set(f.status);
      this.priority.set(f.priority);
      this.sortBy.set(f.sortBy);
    });
  }

  protected onSearchChange(value: string): void {
    this.search.set(value);
    this.emitChange();
  }

  protected onStatusChange(event: MatSelectChange): void {
    this.status.set(event.value);
    this.emitChange();
  }

  protected onPriorityChange(event: MatSelectChange): void {
    this.priority.set(event.value);
    this.emitChange();
  }

  protected onSortChange(event: MatSelectChange): void {
    this.sortBy.set(event.value);
    this.emitChange();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.priority.set('');
    this.sortBy.set('deadline');
    this.emitChange();
  }

  protected hasActiveFilters(): boolean {
    return !!(this.search() || this.status() || this.priority());
  }

  private emitChange(): void {
    this.filterChange.emit({
      search: this.search(),
      status: this.status(),
      priority: this.priority(),
      sortBy: this.sortBy(),
    });
  }
}
