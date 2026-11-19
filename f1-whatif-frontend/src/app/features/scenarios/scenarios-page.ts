import { DOCUMENT, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ScenarioResponse } from '../../core/models';
import { ExplorerActions } from '../../state/explorer/explorer.actions';
import { ReferenceActions } from '../../state/reference/reference.actions';
import { referenceFeature } from '../../state/reference/reference.reducer';
import { ScenariosActions } from '../../state/scenarios/scenarios.actions';
import { scenariosFeature } from '../../state/scenarios/scenarios.reducer';
import { describeScenario } from './describe-scenario';

/** The logged-in user's saved scenarios: open, share and delete them. */
@Component({
  selector: 'app-scenarios-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './scenarios-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenariosPage implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly items = this.store.selectSignal(scenariosFeature.selectItems);
  protected readonly status = this.store.selectSignal(scenariosFeature.selectListStatus);
  protected readonly error = this.store.selectSignal(scenariosFeature.selectListError);
  private readonly rulesets = this.store.selectSignal(referenceFeature.selectRulesets);

  /** The scenario waiting for "Delete" to be confirmed. */
  protected readonly confirmingDelete = signal<number | null>(null);
  protected readonly copied = signal<number | null>(null);

  ngOnInit(): void {
    this.store.dispatch(ReferenceActions.rulesetsNeeded());
    this.store.dispatch(ScenariosActions.pageOpened());
  }

  protected summary(scenario: ScenarioResponse): string {
    return describeScenario(scenario, this.rulesets());
  }

  protected shareLink(scenario: ScenarioResponse): string {
    return `${this.document.location.origin}/shared/${scenario.publicId}`;
  }

  protected open(scenario: ScenarioResponse): void {
    this.store.dispatch(ExplorerActions.scenarioOpened({ scenario, owned: true }));
    void this.router.navigateByUrl('/explorer');
  }

  protected toggleShare(scenario: ScenarioResponse): void {
    this.store.dispatch(ScenariosActions.shareToggled({ id: scenario.id, shared: scenario.publicId === null }));
  }

  protected async copyLink(scenario: ScenarioResponse): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareLink(scenario));
      this.copied.set(scenario.id);
      setTimeout(() => this.copied.update((id) => (id === scenario.id ? null : id)), 2000);
    } catch {
      // Copying is not available (for example without a secure connection); the link stays selectable.
    }
  }

  protected askDelete(id: number): void {
    this.confirmingDelete.set(id);
  }

  protected cancelDelete(): void {
    this.confirmingDelete.set(null);
  }

  protected confirmDelete(id: number): void {
    this.confirmingDelete.set(null);
    this.store.dispatch(ScenariosActions.deleteRequested({ id }));
  }
}
