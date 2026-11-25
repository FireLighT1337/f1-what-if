import { createActionGroup, props } from '@ngrx/store';
import { DriverPhoto, DriverScenarioResponse, DriverSeasonResponse, ScenarioParams } from '../../core/models';

export const DriverActions = createActionGroup({
  source: 'Driver',
  events: {
    'Page Opened': props<{ year: number; driverId: number }>(),
    'Results Requested': props<{ year: number; driverId: number }>(),
    'Results Succeeded': props<{ year: number; driverId: number; response: DriverSeasonResponse }>(),
    'Results Failed': props<{ year: number; driverId: number; error: string }>(),
    /** The driver page was opened with scenario settings in the address. */
    'Scenario Page Opened': props<{ year: number; driverId: number; params: ScenarioParams }>(),
    'Scenario Results Requested': props<{ year: number; driverId: number; params: ScenarioParams }>(),
    'Scenario Results Succeeded': props<{
      year: number;
      driverId: number;
      params: ScenarioParams;
      response: DriverScenarioResponse;
    }>(),
    'Scenario Results Failed': props<{ year: number; driverId: number; params: ScenarioParams; error: string }>(),
    'Photo Requested': props<{ driverId: number }>(),
    'Photo Loaded': props<{ driverId: number; photo: DriverPhoto }>(),
  },
});
