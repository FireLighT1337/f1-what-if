import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ScenarioResponse, StandingsResponse } from '../../core/models';

export const ScenariosActions = createActionGroup({
  source: 'Scenarios',
  events: {
    'Page Opened': emptyProps(),
    'List Loaded': props<{ items: ScenarioResponse[] }>(),
    'List Failed': props<{ error: string }>(),

    /** The settings to save come from the explorer; updateId is null when a new scenario is created. */
    'Save Requested': props<{ name: string; updateId: number | null }>(),
    'Save Succeeded': props<{ scenario: ScenarioResponse }>(),
    'Save Failed': props<{ error: string }>(),
    'Save Dismissed': emptyProps(),

    'Delete Requested': props<{ id: number }>(),
    'Delete Succeeded': props<{ id: number }>(),
    /** shared is the wanted state: true starts sharing, false stops it. */
    'Share Toggled': props<{ id: number; shared: boolean }>(),
    'Scenario Updated': props<{ scenario: ScenarioResponse }>(),
    'Action Failed': props<{ error: string }>(),

    'Shared Opened': props<{ publicId: string }>(),
    'Shared Loaded': props<{ publicId: string; scenario: ScenarioResponse; standings: StandingsResponse }>(),
    'Shared Failed': props<{ publicId: string; error: string }>(),
  },
});
