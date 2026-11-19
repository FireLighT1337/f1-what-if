import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SaveRequest, ScenarioSave } from './scenario-save';

describe('ScenarioSave', () => {
  function create(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [ScenarioSave], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ScenarioSave);
    const base: Record<string, unknown> = { loggedIn: true };
    for (const [name, value] of Object.entries({ ...base, ...inputs })) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const saves: SaveRequest[] = [];
    let dismissed = 0;
    fixture.componentInstance.save.subscribe((request) => saves.push(request));
    fixture.componentInstance.dismiss.subscribe(() => dismissed++);

    return {
      fixture,
      element,
      saves,
      dismissed: () => dismissed,
      click(selector: string): void {
        element.querySelector<HTMLElement>(selector)!.click();
        fixture.detectChanges();
      },
      type(value: string): void {
        const input = element.querySelector<HTMLInputElement>('#scenario-name')!;
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      },
      submit(): void {
        element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
        fixture.detectChanges();
      },
    };
  }

  it('points visitors to the login and sign up pages', () => {
    const { element } = create({ loggedIn: false });

    expect(element.textContent).toContain('to save this scenario');
    expect(element.querySelector('a[href^="/login"]')).not.toBeNull();
    expect(element.querySelector('a[href^="/register"]')).not.toBeNull();
    expect(element.querySelector('button')).toBeNull();
  });

  it('offers a button that opens the form', () => {
    const { element, click } = create();

    click('button');

    expect(element.querySelector('#scenario-name')).not.toBeNull();
  });

  it('disables the button while there is nothing to save', () => {
    const { element } = create({ canSave: false });

    expect(element.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);
  });

  it('saves a new scenario under the entered name', () => {
    const { saves, click, type, submit } = create();

    click('button');
    type('  My scenario  ');
    submit();

    expect(saves).toEqual([{ name: 'My scenario', updateId: null }]);
  });

  it('does not save without a name', () => {
    const { element, saves, click, submit } = create();

    click('button');
    submit();

    expect(saves).toEqual([]);
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });

  it('offers to update the active scenario, with its name filled in', () => {
    const { element, saves, click, submit } = create({ active: { id: 7, name: 'No Monaco' } });

    expect(element.querySelector('button')!.textContent).toContain('Save changes');
    click('button');
    expect(element.querySelector<HTMLInputElement>('#scenario-name')!.value).toBe('No Monaco');
    submit();

    expect(saves).toEqual([{ name: 'No Monaco', updateId: 7 }]);
  });

  it('can save a copy instead of updating', () => {
    const { element, saves, click, type, submit } = create({ active: { id: 7, name: 'No Monaco' } });

    click('button');
    const radios = element.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    radios[1].click();
    type('Copy');
    submit();

    expect(saves).toEqual([{ name: 'Copy', updateId: null }]);
  });

  it('shows the progress and the result of saving', () => {
    const saving = create({ status: 'saving' });
    saving.click('button');
    expect(saving.element.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent).toContain('Saving');

    TestBed.resetTestingModule();
    const failed = create({ status: 'error', error: 'You have reached the limit of 50 saved scenarios.' });
    failed.click('button');
    expect(failed.element.querySelector('[role="alert"]')?.textContent).toContain('limit of 50');
  });

  it('confirms a successful save with a link to all scenarios', () => {
    const { element, fixture, click } = create();
    click('button');

    fixture.componentRef.setInput('status', 'saved');
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Saved.');
    expect(element.querySelector('a[href="/scenarios"]')).not.toBeNull();
  });

  it('reports when the form is closed, so an old result does not linger', () => {
    const { dismissed, click } = create();

    click('button');
    const opened = dismissed();
    click('button[type="button"]');

    expect(dismissed()).toBeGreaterThan(opened);
  });
});
