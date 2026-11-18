import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { DriverActions } from '../../state/driver/driver.actions';
import { selectCurrentEntry, selectCurrentPhoto } from '../../state/driver/driver.selectors';
import { finishClass, finishDescription, finishLabel, initials } from './finish-label';

/** How one driver finished every race of a season, with a photo when one is available. */
@Component({
  selector: 'app-driver-page',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './driver-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverPage {
  /** Both come from the address (/seasons/:year/drivers/:driverId), bound by the router. */
  readonly year = input.required<string>();
  readonly driverId = input.required<string>();

  private readonly store = inject(Store);

  protected readonly entry = this.store.selectSignal(selectCurrentEntry);
  protected readonly photo = this.store.selectSignal(selectCurrentPhoto);

  protected readonly data = computed(() => this.entry()?.data ?? null);
  protected readonly invalidAddress = computed(
    () => !Number.isInteger(Number(this.year())) || !Number.isInteger(Number(this.driverId())),
  );
  protected readonly hasSprints = computed(() => this.data()?.races.some((race) => race.sprint !== null) ?? false);
  protected readonly initials = computed(() => initials(this.data()?.driver.name ?? ''));

  protected readonly finishLabel = finishLabel;
  protected readonly finishDescription = finishDescription;
  protected readonly finishClass = finishClass;

  constructor() {
    effect(() => {
      if (!this.invalidAddress()) {
        this.store.dispatch(
          DriverActions.pageOpened({ year: Number(this.year()), driverId: Number(this.driverId()) }),
        );
      }
    });
  }

  protected retry(): void {
    this.store.dispatch(DriverActions.pageOpened({ year: Number(this.year()), driverId: Number(this.driverId()) }));
  }
}
