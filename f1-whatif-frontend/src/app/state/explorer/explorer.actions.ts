import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ScenarioResponse, StandingsResponse } from '../../core/models';

export const ExplorerActions = createActionGroup({
  source: 'Explorer',
  events: {
    Opened: emptyProps(),
    'Season Changed': props<{ year: number }>(),
    'Ruleset Changed': props<{ code: string }>(),
    'Include Sprints Changed': props<{ value: boolean }>(),
    'Count Best Changed': props<{ value: number | null }>(),
    'Driver Exclusion Toggled': props<{ driverId: number }>(),
    'Round Exclusion Toggled': props<{ round: number }>(),
    'Exclusions Cleared': emptyProps(),
    /** Loads a saved or shared scenario into the explorer; owned scenarios can then be updated. */
    'Scenario Opened': props<{ scenario: ScenarioResponse; owned: boolean }>(),
    'Standings Succeeded': props<{ response: StandingsResponse }>(),
    'Standings Failed': props<{ error: string }>(),
  },
});
