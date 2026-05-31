export type TaskStatus = 'ASSIGNED' | 'ON_PROGRESS' | 'NEED_REVIEW' | 'NEED_REVISION' | 'CLEARED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  title: string;
  assigneeId: number;
  reviewerId: number;
  deadline: string;
  document?: string;
  comment?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  assigneeName?: string;
  reviewerName?: string;
  createdAt?: string;
  attachments?: string[];
  history?: TaskActivity[];
}

export interface TaskActivity {
  id: number;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'ATTACHMENT';
  message: string;
  authorName: string;
  createdAt: string;
}
