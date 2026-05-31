import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  readonly summary = this.dashboardService.getSummary();
  readonly user = computed(() => this.authService.currentUser());
  readonly todayDate = new Date();

  readonly recentTasks = this.dashboardService.getRecentTasks();
  readonly statusDistribution = this.dashboardService.getStatusDistribution();

  readonly kpis = computed(() => [
    {
      title: 'Upcoming Deadline',
      value: this.summary.upcomingDeadline,
      icon: 'event',
      color: 'blue' as const,
      trend: '+2 from yesterday',
      trendDirection: 'up' as const,
    },
    {
      title: 'Uncompleted',
      value: this.summary.uncompletedDeadline,
      icon: 'error_outline',
      color: 'warn' as const,
      trend: '-1 from last week',
      trendDirection: 'down' as const,
    },
    {
      title: 'Due Today',
      value: this.summary.todayDeadline,
      icon: 'today',
      color: 'orange' as const,
      trend: 'On track',
      trendDirection: 'neutral' as const,
    },
    {
      title: 'In Progress',
      value: this.summary.onProgress,
      icon: 'trending_up',
      color: 'primary' as const,
      trend: '+1 in progress',
      trendDirection: 'up' as const,
    },
    {
      title: 'Need Review',
      value: this.summary.needReview,
      icon: 'rate_review',
      color: 'accent' as const,
      trend: 'Awaiting feedback',
      trendDirection: 'neutral' as const,
    },
    {
      title: 'Cleared',
      value: this.summary.cleared,
      icon: 'task_alt',
      color: 'green' as const,
      trend: '+3 completed today',
      trendDirection: 'up' as const,
    },
  ]);

  readonly displayedColumns: string[] = [
    'title',
    'assigneeName',
    'reviewerName',
    'status',
    'deadline',
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'ON_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'NEED_REVIEW':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'NEED_REVISION':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'CLEARED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ');
  }
}
