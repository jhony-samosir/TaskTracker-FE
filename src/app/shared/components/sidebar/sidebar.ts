import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() menuItems: MenuItem[] = [];
  @Input() user: User | null = null;

  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() createExactTask = new EventEmitter<void>();
  @Output() navigateMobile = new EventEmitter<void>();

  onMenuItemClick() {
    this.navigateMobile.emit();
  }

  onCreateTask() {
    this.createExactTask.emit();
  }

  onLogoutClick() {
    this.logout.emit();
  }

  get userInitials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
