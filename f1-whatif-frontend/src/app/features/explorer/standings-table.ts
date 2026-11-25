import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { StandingRow } from '../../core/models';
import { LoadStatus } from '../../state/reference/reference.reducer';

/** The what-if standings, with how each driver moved compared with the real season. */
@Component({
  selector: 'app-standings-table',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './standings-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsTable {
  readonly rows = input.required<StandingRow[]>();
  /** The season the standings are for; the driver links need it. */
  readonly season = input<number | null>(null);
  /** Settings of the what-if that the driver links carry, so the driver page can show the same scenario. */
  readonly queryParams = input<Params | null>(null);
  readonly status = input<LoadStatus>('idle');
  readonly error = input<string | null>(null);

  protected readonly placeholderRows = [1, 2, 3, 4, 5, 6, 7, 8];

  protected changeLabel(row: StandingRow): string {
    const change = row.positionChange;
    if (change === null) {
      return '–';
    }
    if (change === 0) {
      return '=';
    }
    return change > 0 ? `▲ ${change}` : `▼ ${Math.abs(change)}`;
  }

  protected changeDescription(row: StandingRow): string {
    const change = row.positionChange;
    if (change === null) {
      return 'No real result to compare with';
    }
    if (change === 0) {
      return 'Same position as in reality';
    }
    const places = Math.abs(change) === 1 ? 'place' : 'places';
    return change > 0
      ? `${change} ${places} better than in reality`
      : `${Math.abs(change)} ${places} worse than in reality`;
  }

  protected changeClass(row: StandingRow): string {
    const change = row.positionChange;
    if (change === null || change === 0) {
      return 'text-zinc-500';
    }
    return change > 0 ? 'text-emerald-400' : 'text-red-400';
  }
}
