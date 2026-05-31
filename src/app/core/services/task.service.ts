import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskActivity, TaskComment, TaskDocument, TaskPriority, TaskStatus } from '../models/task.model';
import { ApiResponse } from './auth.service';

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  reviewerId?: number;
  sortBy?: 'deadline' | 'newest' | 'priority' | 'status';
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId: number;
  reviewerId: number;
  deadline: string;
  priority: TaskPriority;
  comment?: string;
  document?: string;
}

export interface UpdateTaskRequest extends CreateTaskRequest {}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  remarks?: string;
}

export interface AddTaskCommentRequest {
  comment: string;
}

export interface AttachTaskDocumentRequest {
  fileName: string;
  mimeType: string;
  fileSize?: number;
  fileBase64: string;
  documentType?: string;
  documentVersion?: number;
}

interface ApiTaskResponse {
  taskId: number;
  taskTitle: string;
  taskDescription?: string | null;
  assigneeUserId: number;
  assigneeName: string;
  reviewerUserId: number;
  reviewerName: string;
  deadlineDate: string;
  taskStatusId: number;
  statusName: string;
  createdDate: string;
  createdBy?: string | null;
  updatedDate?: string | null;
  updatedBy?: string | null;
  isOverdue: boolean;
  history?: ApiTaskHistoryResponse[];
  comments?: ApiTaskCommentResponse[];
  documents?: ApiTaskDocumentResponse[];
}

interface ApiTaskHistoryResponse {
  taskHistoryId: number;
  oldTaskStatusId?: number | null;
  oldStatusName?: string | null;
  newTaskStatusId: number;
  newStatusName: string;
  actionType: string;
  remarks?: string | null;
  createdDate: string;
  createdBy?: string | null;
}

interface ApiTaskCommentResponse {
  taskCommentId: number;
  reviewerUserId: number;
  reviewerName: string;
  commentText: string;
  createdDate: string;
  createdBy?: string | null;
}

interface ApiTaskDocumentResponse {
  taskDocumentId: number;
  documentId: number;
  fileName: string;
  mimeType: string;
  fileSize?: number | null;
  documentType: string;
  documentVersion: number;
  createdDate: string;
  createdBy?: string | null;
}

interface ApiCreateTaskRequest {
  taskTitle: string;
  taskDescription?: string;
  assigneeUserId: number;
  reviewerUserId: number;
  deadlineDate: string;
  taskStatusId: number;
}

interface ApiUpdateTaskStatusRequest {
  taskStatusId: number;
  remarks?: string;
}

interface ApiAddTaskCommentRequest {
  commentText: string;
}

interface ApiAttachTaskDocumentRequest {
  fileName: string;
  mimeType: string;
  fileSize?: number;
  fileBase64: string;
  documentType: string;
  documentVersion: number;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly tasksApiUrl = `${environment.apiUrl}/tasks`;
  private readonly myTasksApiUrl = `${environment.apiUrl}/my-tasks`;
  private readonly tasksSignal = signal<Task[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly tasks = this.tasksSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadMyTasks(filters: TaskFilters = {}): void {
    this.loadTasks(() => this.getMyTasks(filters));
  }

  loadManagedTasks(filters: TaskFilters = {}): void {
    this.loadTasks(() => this.getManagedTasks(filters));
  }

  getMyTasks(filters: TaskFilters = {}): Observable<Task[]> {
    const params = this.buildParams(filters, true);

    return this.http.get<ApiResponse<ApiTaskResponse[]>>(`${this.myTasksApiUrl}`, { params }).pipe(
      map((response) => this.unwrapResponse(response, 'Failed to load tasks.')),
      map((tasks) => tasks.map((task) => this.mapTask(task))),
      map((tasks) => this.applyLocalFilters(tasks, filters)),
    );
  }

  getManagedTasks(filters: TaskFilters = {}): Observable<Task[]> {
    const params = this.buildParams(filters);

    return this.http.get<ApiResponse<ApiTaskResponse[]>>(`${this.tasksApiUrl}`, { params }).pipe(
      map((response) => this.unwrapResponse(response, 'Failed to load managed tasks.')),
      map((tasks) => tasks.map((task) => this.mapTask(task))),
      map((tasks) => this.applyLocalFilters(tasks, filters)),
    );
  }

  createTask(request: CreateTaskRequest): Observable<Task> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    
    const apiRequest: ApiCreateTaskRequest = {
      taskTitle: request.title,
      taskDescription: request.description,
      assigneeUserId: request.assigneeId,
      reviewerUserId: request.reviewerId,
      deadlineDate: request.deadline,
      taskStatusId: this.statusRank('ASSIGNED'),
    };

    return this.http.post<ApiResponse<ApiTaskResponse>>(`${this.tasksApiUrl}`, apiRequest).pipe(
      map((response) => this.unwrapResponse(response, 'Failed to create task.')),
      map((data) => this.mapTask(data)),
      tap((task) => {
        this.tasksSignal.update((tasks) => [task, ...tasks]);
      }),
      catchError((error: unknown) => {
        this.errorSignal.set(this.getErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  updateTask(taskId: number, request: UpdateTaskRequest): Observable<Task> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    
    const existingStatus = this.tasksSignal().find((task) => task.id === taskId)?.status ?? 'ASSIGNED';
    const apiRequest: ApiCreateTaskRequest = {
      taskTitle: request.title,
      taskDescription: request.description,
      assigneeUserId: request.assigneeId,
      reviewerUserId: request.reviewerId,
      deadlineDate: request.deadline,
      taskStatusId: this.statusRank(existingStatus),
    };

    return this.http.put<ApiResponse<ApiTaskResponse>>(`${this.tasksApiUrl}/${taskId}`, apiRequest).pipe(
      map((response) => this.unwrapResponse(response, 'Failed to update task.')),
      map((data) => this.mapTask(data)),
      tap((task) => {
        this.tasksSignal.update((tasks) =>
          tasks.map((t) => (t.id === taskId ? task : t)),
        );
      }),
      catchError((error: unknown) => {
        this.errorSignal.set(this.getErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  deleteTask(taskId: number): Observable<boolean> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.delete<ApiResponse<boolean>>(`${this.tasksApiUrl}/${taskId}`).pipe(
      map((response) => this.unwrapResponse(response, 'Failed to delete task.')),
      tap(() => {
        this.tasksSignal.update((tasks) => tasks.filter((t) => t.id !== taskId));
      }),
      catchError((error: unknown) => {
        this.errorSignal.set(this.getErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  private loadTasks(loadFn: () => Observable<Task[]>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    loadFn()
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (tasks) => this.tasksSignal.set(tasks),
        error: (error: unknown) => this.errorSignal.set(this.getErrorMessage(error)),
      });
  }

  updateTaskStatus(
    taskId: number,
    statusOrRequest: TaskStatus | UpdateTaskStatusRequest,
    isMyTask = false,
  ): Observable<Task> {
    const request: UpdateTaskStatusRequest =
      typeof statusOrRequest === 'string' ? { status: statusOrRequest } : statusOrRequest;
    const previousTasks = this.tasksSignal();
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, status: request.status } : task)),
    );

    const apiRequest: ApiUpdateTaskStatusRequest = {
      taskStatusId: this.statusRank(request.status),
      remarks: request.remarks,
    };

    const baseUrl = isMyTask ? this.myTasksApiUrl : this.tasksApiUrl;
    
    return this.http
      .put<ApiResponse<ApiTaskResponse>>(`${baseUrl}/${taskId}/status`, apiRequest)
      .pipe(
        map((response) => this.unwrapResponse(response, 'Failed to update task status.')),
        map((data) => this.mapTask(data)),
        tap((task) => {
          this.tasksSignal.update((tasks) =>
            tasks.map((t) => (t.id === taskId ? { ...t, ...task } : t)),
          );
        }),
        catchError((error: unknown) => {
          this.tasksSignal.set(previousTasks);
          this.errorSignal.set(this.getErrorMessage(error));
          return throwError(() => error);
        }),
        finalize(() => this.savingSignal.set(false)),
      );
  }

  addComment(taskId: number, request: AddTaskCommentRequest, isMyTask = false): Observable<TaskComment> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);

    const baseUrl = isMyTask ? this.myTasksApiUrl : this.tasksApiUrl;
    const apiRequest: ApiAddTaskCommentRequest = { commentText: request.comment };

    return this.http
      .post<ApiResponse<ApiTaskCommentResponse>>(`${baseUrl}/${taskId}/comments`, apiRequest)
      .pipe(
        map((response) => this.unwrapResponse(response, 'Failed to add comment.')),
        map((comment) => this.mapComment(comment)),
        tap((comment) => {
          this.tasksSignal.update((tasks) =>
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    comment: comment.comment,
                    comments: [comment, ...(task.comments ?? [])],
                    history: [
                      {
                        id: Date.now(),
                        type: 'COMMENT',
                        message: comment.comment,
                        authorName: comment.authorName,
                        createdAt: comment.createdAt,
                      },
                      ...(task.history ?? []),
                    ],
                  }
                : task,
            ),
          );
        }),
        catchError((error: unknown) => {
          this.errorSignal.set(this.getErrorMessage(error));
          return throwError(() => error);
        }),
        finalize(() => this.savingSignal.set(false)),
      );
  }

  attachDocument(
    taskId: number,
    request: AttachTaskDocumentRequest,
  ): Observable<TaskDocument> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);

    const apiRequest: ApiAttachTaskDocumentRequest = {
      fileName: request.fileName,
      mimeType: request.mimeType,
      fileSize: request.fileSize,
      fileBase64: request.fileBase64,
      documentType: request.documentType ?? 'Attachment',
      documentVersion: request.documentVersion ?? 1,
    };

    return this.http
      .post<ApiResponse<ApiTaskDocumentResponse>>(`${this.tasksApiUrl}/${taskId}/documents`, apiRequest)
      .pipe(
        map((response) => this.unwrapResponse(response, 'Failed to attach document.')),
        map((document) => this.mapDocument(document)),
        tap((document) => {
          this.tasksSignal.update((tasks) =>
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    document: task.document ?? document.fileName,
                    attachments: [...(task.attachments ?? []), document.fileName],
                    documents: [...(task.documents ?? []), document],
                    history: [
                      {
                        id: Date.now(),
                        type: 'ATTACHMENT',
                        message: `Attached ${document.fileName}`,
                        authorName: document.uploadedBy ?? 'System',
                        createdAt: document.uploadedAt,
                      },
                      ...(task.history ?? []),
                    ],
                  }
                : task,
            ),
          );
        }),
        catchError((error: unknown) => {
          this.errorSignal.set(this.getErrorMessage(error));
          return throwError(() => error);
        }),
        finalize(() => this.savingSignal.set(false)),
      );
  }

  private buildParams(filters: TaskFilters, isMyTask = false): HttpParams {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('statusId', String(this.statusRank(filters.status)));
    if (!isMyTask && filters.assigneeId) {
      params = params.set('assigneeId', String(filters.assigneeId));
    }
    if (!isMyTask && filters.reviewerId) {
      params = params.set('reviewerId', String(filters.reviewerId));
    }
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);

    return params;
  }

  private unwrapResponse<T>(response: ApiResponse<T>, errorMessage: string): T {
    if (!response.succeeded) {
      throw new Error(response.message || errorMessage);
    }

    return response.data;
  }

  private mapTask(apiTask: ApiTaskResponse): Task {
    const documents = (apiTask.documents ?? []).map((document) => this.mapDocument(document));
    const comments = (apiTask.comments ?? []).map((comment) => this.mapComment(comment));

    return {
      id: apiTask.taskId,
      title: apiTask.taskTitle,
      assigneeId: apiTask.assigneeUserId,
      reviewerId: apiTask.reviewerUserId,
      deadline: apiTask.deadlineDate.split('T')[0],
      document: documents[0]?.fileName,
      comment: comments[0]?.comment,
      status: this.reverseStatusRank(apiTask.taskStatusId),
      statusId: apiTask.taskStatusId,
      priority: 'MEDIUM',
      description: apiTask.taskDescription ?? undefined,
      assigneeName: apiTask.assigneeName,
      reviewerName: apiTask.reviewerName,
      createdAt: apiTask.createdDate,
      createdBy: apiTask.createdBy ?? undefined,
      updatedAt: apiTask.updatedDate ?? undefined,
      updatedBy: apiTask.updatedBy ?? undefined,
      isOverdue: apiTask.isOverdue,
      attachments: documents.map((document) => document.fileName),
      comments,
      documents,
      history: (apiTask.history ?? []).map((history) => this.mapHistory(history)),
    };
  }

  private mapHistory(history: ApiTaskHistoryResponse): TaskActivity {
    return {
      id: history.taskHistoryId,
      type: history.actionType === 'ATTACHMENT' ? 'ATTACHMENT' : 'STATUS_CHANGE',
      message: history.remarks ?? history.newStatusName,
      authorName: history.createdBy ?? 'System',
      createdAt: history.createdDate,
      fromStatus: history.oldStatusName ? this.reverseStatusName(history.oldStatusName) : undefined,
      toStatus: this.reverseStatusName(history.newStatusName),
    };
  }

  private mapComment(comment: ApiTaskCommentResponse): TaskComment {
    return {
      id: comment.taskCommentId,
      comment: comment.commentText,
      authorName: comment.reviewerName,
      createdAt: comment.createdDate,
    };
  }

  private mapDocument(document: ApiTaskDocumentResponse): TaskDocument {
    return {
      id: document.taskDocumentId,
      fileName: document.fileName,
      filePath: `${document.documentId}/${document.fileName}`,
      uploadedBy: document.createdBy ?? undefined,
      uploadedAt: document.createdDate,
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong. Please try again.';
  }

  private applyLocalFilters(tasks: Task[], filters: TaskFilters): Task[] {
    let filteredTasks = [...tasks];

    if (filters.search?.trim()) {
      const query = filters.search.trim().toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.comment?.toLowerCase().includes(query),
      );
    }

    if (filters.status) {
      filteredTasks = filteredTasks.filter((task) => task.status === filters.status);
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter((task) => task.priority === filters.priority);
    }

    if (filters.assigneeId) {
      filteredTasks = filteredTasks.filter((task) => task.assigneeId === filters.assigneeId);
    }

    if (filters.reviewerId) {
      filteredTasks = filteredTasks.filter((task) => task.reviewerId === filters.reviewerId);
    }

    return filteredTasks.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
        case 'priority':
          return this.priorityRank(b.priority) - this.priorityRank(a.priority);
        case 'status':
          return this.statusRank(a.status) - this.statusRank(b.status);
        case 'deadline':
        default:
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
    });
  }

  private priorityRank(priority: TaskPriority = 'LOW'): number {
    const rank: Record<TaskPriority, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      URGENT: 4,
    };

    return rank[priority];
  }

  private statusRank(status: TaskStatus): number {
    const rank: Record<TaskStatus, number> = {
      ASSIGNED: 1,
      ON_PROGRESS: 2,
      NEED_REVIEW: 3,
      NEED_REVISION: 4,
      CLEARED: 5,
    };

    return rank[status];
  }

  private reverseStatusRank(statusId: number): TaskStatus {
    const rank: Record<number, TaskStatus> = {
      1: 'ASSIGNED',
      2: 'ON_PROGRESS',
      3: 'NEED_REVIEW',
      4: 'NEED_REVISION',
      5: 'CLEARED',
    };
    return rank[statusId] ?? 'ASSIGNED';
  }

  private reverseStatusName(name: string): TaskStatus {
    const n = name.toUpperCase().replace(' ', '_');
    if (n === 'ON_PROGRESS' || n === 'IN_PROGRESS') return 'ON_PROGRESS';
    if (n === 'NEED_REVIEW' || n === 'NEEDS_REVIEW') return 'NEED_REVIEW';
    if (n === 'NEED_REVISION' || n === 'NEEDS_REVISION') return 'NEED_REVISION';
    if (n === 'CLEARED') return 'CLEARED';
    return 'ASSIGNED';
  }
}
