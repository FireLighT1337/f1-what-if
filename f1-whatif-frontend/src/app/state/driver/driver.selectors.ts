import { createSelector } from '@ngrx/store';
import { DriverPhoto } from '../../core/models';
import { DriverEntry, driverFeature, driverKey } from './driver.reducer';

/** The state of the page that is open: null until the first request has started. */
export const selectCurrentEntry = createSelector(
  driverFeature.selectCurrent,
  driverFeature.selectEntries,
  (current, entries): DriverEntry | null => (current === null ? null : (entries[driverKey(current.year, current.driverId)] ?? null)),
);

/** The photo of the open driver; null while it is still being looked up. */
export const selectCurrentPhoto = createSelector(
  driverFeature.selectCurrent,
  driverFeature.selectPhotos,
  (current, photos): DriverPhoto | null => (current === null ? null : (photos[current.driverId] ?? null)),
);
