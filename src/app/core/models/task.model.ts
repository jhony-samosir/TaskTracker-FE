export interface Task {
  id: number;
  title: string;
  assigneeId: number;
  reviewerId: number;
  deadline: string;
  document?: string;
  comment?: string;
  status: 'ASSIGNED' | 'ON_PROGRESS' | 'NEED_REVIEW' | 'NEED_REVISION' | 'CLEARED';
}
