import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { MenuItem } from '../../core/models/menu-item.model';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

const ALL_MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Task Management', icon: 'assignment', route: '/tasks', roles: ['ADMIN'] },
  { label: 'My Tasks', icon: 'task', route: '/my-tasks', roles: ['ADMIN', 'EMPLOYEE'] },
];

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, MatIconModule, MatTooltipModule, SidebarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
  },
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidenavOpen = signal(true);
  readonly isMobile = signal(false);
  readonly user = computed(() => this.authService.currentUser());

  ngOnInit() {
    this.checkScreenSize();
  }

  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const isMobileNow = window.innerWidth < 768;
    if (isMobileNow !== this.isMobile()) {
      this.isMobile.set(isMobileNow);
      // Auto close on mobile, open on desktop
      this.sidenavOpen.set(!isMobileNow);
    }
  }

  // Listen to router changes to compute current page title breadcrumb
  private readonly navEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
  );

  readonly pageTitle = computed(() => {
    const url = this.navEnd() || this.router.url;
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/tasks')) return 'Task Management';
    if (url.includes('/my-tasks')) return 'My Tasks';
    return 'Task Tracker';
  });

  readonly menuItems = computed<MenuItem[]>(() => {
    const role = this.user()?.role;
    if (!role) return [];
    return ALL_MENU_ITEMS.filter((item) => item.roles.includes(role));
  });

  toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  createTask(): void {
    // Navigate to create task or open modal
    this.router.navigate(['/tasks']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
