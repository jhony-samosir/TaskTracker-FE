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
  statusId?: number;
  priority?: TaskPriority;
  description?: string;
  assigneeName?: string;
  reviewerName?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  createdBy?: string;
  isOverdue?: boolean;
  attachments?: string[];
  comments?: TaskComment[];
  documents?: TaskDocument[];
  history?: TaskActivity[];
}

export interface TaskActivity {
  id: number;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'ATTACHMENT';
  message: string;
  authorName: string;
  createdAt: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
}

export interface TaskComment {
  id: number;
  comment: string;
  authorName: string;
  createdAt: string;
}

export interface TaskDocument {
  id: number;
  fileName: string;
  filePath: string;
  uploadedBy?: string;
  uploadedAt: string;
}
