import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-widget',
  imports: [],
  templateUrl: './dashboard-widget.html',
  styleUrl: './dashboard-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidgetComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
