import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { TaskCardComponent } from '../task-card/task-card';

interface BoardColumn {
  id: string;
  title: string;
  statuses: TaskStatus[];
  colorClass: string;
  headerColorClass: string;
}

@Component({
  selector: 'app-task-board',
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule, MatTabsModule, MatIconModule, TaskCardComponent],
})
export class TaskBoardComponent {
  readonly tasks = input.required<Task[]>();
  readonly taskSelected = output<Task>();
  readonly statusChange = output<{ task: Task; status: TaskStatus }>();

  readonly activeMobileTab = signal(0);

  readonly columns: BoardColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      statuses: ['ASSIGNED', 'NEED_REVISION'],
      colorClass: 'bg-slate-50 border-slate-200/60',
      headerColorClass: 'text-slate-700 bg-slate-100',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      statuses: ['ON_PROGRESS'],
      colorClass: 'bg-indigo-50/30 border-indigo-100/50',
      headerColorClass: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'need_review',
      title: 'Need Review',
      statuses: ['NEED_REVIEW'],
      colorClass: 'bg-amber-50/20 border-amber-100/50',
      headerColorClass: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      id: 'completed',
      title: 'Completed',
      statuses: ['CLEARED'],
      colorClass: 'bg-emerald-50/20 border-emerald-100/50',
      headerColorClass: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
  ];

  // Map tasks to columns reactively
  readonly boardState = computed(() => {
    const allTasks = this.tasks();
    return this.columns.reduce<Record<string, Task[]>>((acc, col) => {
      acc[col.id] = allTasks.filter((task) => col.statuses.includes(task.status));
      return acc;
    }, {});
  });

  protected getConnectedList(): string[] {
    return this.columns.map((col) => col.id);
  }

  protected onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      const list = [...event.container.data];
      moveItemInArray(list, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const targetColumnId = event.container.id;
      const targetColumn = this.columns.find((col) => col.id === targetColumnId);

      if (targetColumn && task) {
        // Map column back to status. Choose the first status in the column's allowed statuses.
        const newStatus = targetColumn.statuses[0];
        this.statusChange.emit({ task, status: newStatus });
      }
    }
  }

  protected onCardStatusChange(event: { task: Task; status: TaskStatus }): void {
    this.statusChange.emit(event);
  }

  protected onCardSelect(task: Task): void {
    this.taskSelected.emit(task);
  }
}
