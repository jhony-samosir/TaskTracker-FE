import { Task, TaskPriority, TaskStatus } from '../../../core/models/task.model';

export type TaskManagementSortBy = 'deadline' | 'newest' | 'priority' | 'status';

export interface TaskManagementFilters {
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  assigneeId: number | '';
  reviewerId: number | '';
  sortBy: TaskManagementSortBy;
}

export interface TaskManagementUserOption {
  id: number;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface TaskManagementMetrics {
  total: number;
  assigned: number;
  onProgress: number;
  needReview: number;
  needRevision: number;
  cleared: number;
  overdue: number;
  dueSoon: number;
}

export interface TaskFormValue {
  title: string;
  description: string;
  assigneeId: number;
  reviewerId: number;
  deadline: string;
  priority: TaskPriority;
  comment: string;
  document: string;
}

export interface TaskFormDialogData {
  mode: 'create' | 'edit';
  task?: Task;
  users: TaskManagementUserOption[];
}

export interface TaskFormDialogResult {
  mode: 'create' | 'edit';
  value: TaskFormValue;
  taskId?: number;
}

export interface TaskManagementDetailData {
  task: Task;
}

export interface TaskManagementDetailResult {
  action: 'edit' | 'status';
  task: Task;
  status?: TaskStatus;
}
