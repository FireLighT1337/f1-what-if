import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ScenarioResponse } from '../../core/models';
import { ExplorerActions } from '../../state/explorer/explorer.actions';
import { ReferenceActions } from '../../state/reference/reference.actions';
import { initialReferenceState } from '../../state/reference/reference.reducer';
import { ScenariosActions } from '../../state/scenarios/scenarios.actions';
import { ScenariosState, initialScenariosState } from '../../state/scenarios/scenarios.reducer';
import { ScenariosPage } from './scenarios-page';

function scenario(id: number, name: string, publicId: string | null = null): ScenarioResponse {
  return {
    id,
    name,
    seasonYear: 1984,
    rulesetCode: 'classic-1961',
    includeSprints: true,
    countBest: 11,
    excludedDriverIds: [],
    excludedRounds: [6],
    publicId,
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T10:30:00Z',
  };
}

describe('ScenariosPage', () => {
  function create(scenarios: Partial<ScenariosState> = {}) {
    TestBed.configureTestingModule({
      imports: [ScenariosPage],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {
            scenarios: { ...initialScenariosState, listStatus: 'loaded', ...scenarios },
            reference: {
              ...initialReferenceState,
              rulesets: [{ code: 'classic-1961', name: '1961-1990', description: '' }],
            },
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(ScenariosPage);
    const store = TestBed.inject(MockStore);
    const dispatch = vi.spyOn(store, 'dispatch');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const button = (text: string): HTMLButtonElement =>
      Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)!;
    return { fixture, element, dispatch, navigate, button };
  }

  it('asks for the scenarios and the points system names when it opens', () => {
    const { dispatch } = create();

    expect(dispatch).toHaveBeenCalledWith(ReferenceActions.rulesetsNeeded());
    expect(dispatch).toHaveBeenCalledWith(ScenariosActions.pageOpened());
  });

  it('lists each scenario with its settings', () => {
    const { element } = create({ items: [scenario(1, 'No Monaco'), scenario(2, 'Another')] });

    const names = Array.from(element.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(names).toEqual(['No Monaco', 'Another']);
    expect(element.textContent).toContain('1984 · 1961-1990 · best 11 · 1 exclusion');
  });

  it('shows a hint when nothing is saved yet', () => {
    const { element } = create({ items: [] });

    expect(element.textContent).toContain('You have not saved any scenarios yet.');
    expect(element.querySelector('a[href="/explorer"]')).not.toBeNull();
  });

  it('shows errors from loading, deleting and sharing', () => {
    const { element } = create({ items: [scenario(1, 'A')], listError: 'Something went wrong (error 500).' });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('error 500');
  });

  it('opens a scenario in the explorer', () => {
    const item = scenario(1, 'No Monaco');
    const { dispatch, navigate, button } = create({ items: [item] });

    button('Open').click();

    expect(dispatch).toHaveBeenCalledWith(ExplorerActions.scenarioOpened({ scenario: item, owned: true }));
    expect(navigate).toHaveBeenCalledWith('/explorer');
  });

  it('starts sharing and stops it again', () => {
    const { dispatch, button, fixture } = create({ items: [scenario(1, 'A'), scenario(2, 'B', 'public-id')] });

    const shareButtons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).filter((b) =>
      ['Share', 'Stop sharing'].includes(b.textContent?.trim() ?? ''),
    );
    shareButtons[0].click();
    shareButtons[1].click();

    expect(dispatch).toHaveBeenCalledWith(ScenariosActions.shareToggled({ id: 1, shared: true }));
    expect(dispatch).toHaveBeenCalledWith(ScenariosActions.shareToggled({ id: 2, shared: false }));
    expect(button).toBeDefined();
  });

  it('shows the link of a shared scenario', () => {
    const { element } = create({ items: [scenario(2, 'B', 'public-id')] });

    const input = element.querySelector<HTMLInputElement>('input[readonly]')!;
    expect(input.value).toMatch(/\/shared\/public-id$/);
  });

  it('asks for confirmation before deleting', () => {
    const { dispatch, button, fixture } = create({ items: [scenario(1, 'A')] });

    button('Delete').click();
    fixture.detectChanges();
    expect(dispatch).not.toHaveBeenCalledWith(ScenariosActions.deleteRequested({ id: 1 }));

    button('Delete for good').click();

    expect(dispatch).toHaveBeenCalledWith(ScenariosActions.deleteRequested({ id: 1 }));
  });

  it('can back out of a delete', () => {
    const { dispatch, button, fixture } = create({ items: [scenario(1, 'A')] });

    button('Delete').click();
    fixture.detectChanges();
    button('Cancel').click();
    fixture.detectChanges();

    expect(button('Delete')).toBeDefined();
    expect(dispatch).not.toHaveBeenCalledWith(ScenariosActions.deleteRequested({ id: 1 }));
  });
});
