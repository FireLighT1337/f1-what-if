import { createSelector } from '@ngrx/store';
import { DriverPhoto } from '../../core/models';
import { DriverEntry, DriverScenarioEntry, driverFeature, driverKey, driverScenarioKey } from './driver.reducer';

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

/** The scenario results of the open page; null when it has no scenario or the request has not started. */
export const selectCurrentScenarioEntry = createSelector(
  driverFeature.selectCurrentScenario,
  driverFeature.selectScenarioEntries,
  (current, entries): DriverScenarioEntry | null =>
    current === null ? null : (entries[driverScenarioKey(current.year, current.driverId, current.params)] ?? null),
);
