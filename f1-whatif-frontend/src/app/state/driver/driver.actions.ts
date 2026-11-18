import { createActionGroup, props } from '@ngrx/store';
import { DriverPhoto, DriverSeasonResponse } from '../../core/models';

export const DriverActions = createActionGroup({
  source: 'Driver',
  events: {
    'Page Opened': props<{ year: number; driverId: number }>(),
    'Results Requested': props<{ year: number; driverId: number }>(),
    'Results Succeeded': props<{ year: number; driverId: number; response: DriverSeasonResponse }>(),
    'Results Failed': props<{ year: number; driverId: number; error: string }>(),
    'Photo Requested': props<{ driverId: number }>(),
    'Photo Loaded': props<{ driverId: number; photo: DriverPhoto }>(),
  },
});
