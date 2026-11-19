import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaveStatus } from '../../state/scenarios/scenarios.reducer';

export interface SaveRequest {
  name: string;
  /** Null creates a new scenario; otherwise the scenario with this id is replaced. */
  updateId: number | null;
}

/** Saves the current explorer settings as a scenario. Logged-out users are pointed to the login page. */
@Component({
  selector: 'app-scenario-save',
  imports: [RouterLink],
  templateUrl: './scenario-save.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioSave {
  readonly loggedIn = input(false);
  /** The saved scenario the settings were loaded from, if any. */
  readonly active = input<{ id: number; name: string } | null>(null);
  readonly status = input<SaveStatus>('idle');
  readonly error = input<string | null>(null);
  /** False while there is nothing calculated to save. */
  readonly canSave = input(true);

  readonly save = output<SaveRequest>();
  readonly dismiss = output<void>();

  protected readonly open = signal(false);
  protected readonly name = signal('');
  /** With an active scenario the user can overwrite it or save a copy. */
  protected readonly mode = signal<'update' | 'new'>('update');

  protected readonly updating = computed(() => this.active() !== null && this.mode() === 'update');
  protected readonly nameValid = computed(() => {
    const length = this.name().trim().length;
    return length >= 1 && length <= 100;
  });

  protected openForm(): void {
    this.dismiss.emit();
    this.name.set(this.active()?.name ?? '');
    this.mode.set('update');
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.dismiss.emit();
  }

  protected onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected onMode(mode: 'update' | 'new'): void {
    this.mode.set(mode);
    if (mode === 'new') {
      this.name.set('');
    } else {
      this.name.set(this.active()?.name ?? '');
    }
  }

  protected submit(): void {
    if (!this.nameValid() || this.status() === 'saving') {
      return;
    }
    this.save.emit({ name: this.name().trim(), updateId: this.updating() ? this.active()!.id : null });
  }
}
