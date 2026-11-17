import { InjectionToken } from '@angular/core';

/**
 * Base path of the backend API. Relative on purpose: the dev server proxies /api to the
 * Spring Boot app (proxy.conf.json), and in production the host forwards /api the same way,
 * so the browser only ever talks to its own origin.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
