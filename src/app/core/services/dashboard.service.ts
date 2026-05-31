import { Injectable } from '@angular/core';
import { DashboardSummary } from '../models/dashboard.model';
import { Task } from '../models/task.model';

export interface TaskStatusDistribution {
  status: 'Assigned' | 'On Progress' | 'Need Review' | 'Need Revision' | 'Cleared';
  count: number;
  percentage: number;
  colorClass: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  getSummary(): DashboardSummary {
    return {
      upcomingDeadline: 8,
      uncompletedDeadline: 3,
      todayDeadline: 2,
      onProgress: 5,
      needReview: 4,
      cleared: 12,
    };
  }

  getRecentTasks(): Array<Task & { assigneeName: string; reviewerName: string }> {
    return [
      {
        id: 101,
        title: 'Revamp authentication layout and route structure',
        assigneeId: 10,
        assigneeName: 'Alex Mercer',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-06-01',
        status: 'ON_PROGRESS',
      },
      {
        id: 102,
        title: 'Create Material KPI Dashboard and statistic widgets',
        assigneeId: 11,
        assigneeName: 'Sarah Connor',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-05-30',
        status: 'NEED_REVIEW',
      },
      {
        id: 103,
        title: 'Implement Angular Material sidenav design specification',
        assigneeId: 12,
        assigneeName: 'John Doe',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-05-29',
        status: 'CLEARED',
      },
      {
        id: 104,
        title: 'Form validation and accessibility adjustments',
        assigneeId: 13,
        assigneeName: 'Emily Watson',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-06-03',
        status: 'ASSIGNED',
      },
      {
        id: 105,
        title: 'Verify responsiveness on mobile and tablet devices',
        assigneeId: 10,
        assigneeName: 'Alex Mercer',
        reviewerId: 2,
        reviewerName: 'Admin User',
        deadline: '2026-05-28',
        status: 'NEED_REVISION',
      },
    ];
  }

  getStatusDistribution(): TaskStatusDistribution[] {
    return [
      { status: 'Assigned', count: 3, percentage: 12, colorClass: 'bg-blue-600' },
      { status: 'On Progress', count: 5, percentage: 19, colorClass: 'bg-indigo-600' },
      { status: 'Need Review', count: 4, percentage: 15, colorClass: 'bg-orange-500' },
      { status: 'Need Revision', count: 2, percentage: 8, colorClass: 'bg-rose-600' },
      { status: 'Cleared', count: 12, percentage: 46, colorClass: 'bg-emerald-600' },
    ];
  }
}
