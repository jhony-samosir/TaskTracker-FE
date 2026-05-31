import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-statistic-card',
  imports: [MatIconModule],
  templateUrl: './statistic-card.html',
  styleUrl: './statistic-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<number>();
  readonly icon = input.required<string>();
  readonly color = input.required<'primary' | 'warn' | 'accent' | 'blue' | 'orange' | 'green'>();
  readonly trend = input<string>('');
  readonly trendDirection = input<'up' | 'down' | 'neutral'>('neutral');
}
