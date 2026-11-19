import { Injectable } from '@angular/core';

export interface StoredSession {
  token: string;
  /** Milliseconds since 1970, when the token stops being valid. */
  expiresAt: number;
}

const KEY = 'f1whatif.session';

/**
 * Keeps the login token in the browser so a page reload does not log the user out.
 * Tokens are short-lived, and storage that is blocked or full is simply ignored.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) {
        return null;
      }
      const value = JSON.parse(raw) as Partial<StoredSession> | null;
      if (typeof value?.token === 'string' && typeof value.expiresAt === 'number' && value.expiresAt > Date.now()) {
        return { token: value.token, expiresAt: value.expiresAt };
      }
      localStorage.removeItem(KEY);
      return null;
    } catch {
      return null;
    }
  }

  save(session: StoredSession): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      // Storage is blocked or full: the user stays logged in until the page is reloaded.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing to clear.
    }
  }
}
