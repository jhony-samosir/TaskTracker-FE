import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import {
  TaskManagementFilters,
  TaskManagementUserOption,
} from '../../models/task-management.model';

@Component({
  selector: 'app-task-management-toolbar',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './task-management-toolbar.html',
  styleUrl: './task-management-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskManagementToolbar {
  readonly filters = input.required<TaskManagementFilters>();
  readonly users = input.required<TaskManagementUserOption[]>();
  readonly filterChange = output<TaskManagementFilters>();
  readonly clearFilters = output<void>();

  protected readonly statuses: { value: TaskStatus; label: string }[] = [
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'ON_PROGRESS', label: 'On Progress' },
    { value: 'NEED_REVIEW', label: 'Need Review' },
    { value: 'NEED_REVISION', label: 'Need Revision' },
    { value: 'CLEARED', label: 'Cleared' },
  ];

  protected readonly priorities: { value: TaskPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  protected emitPatch(patch: Partial<TaskManagementFilters>): void {
    this.filterChange.emit({ ...this.filters(), ...patch });
  }
}
