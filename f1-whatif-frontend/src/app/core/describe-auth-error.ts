import { HttpErrorResponse } from '@angular/common/http';

/** Messages for the login and registration forms. */
export function describeAuthError(error: unknown, mode: 'login' | 'register'): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0:
        return 'Cannot reach the server. Check your connection and try again.';
      case 400:
        return 'Please check your input: use a valid email address and a password of 8 to 72 characters.';
      case 401:
        return 'Invalid email or password.';
      case 409:
        return 'That email address is already registered.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
    }
  }
  return mode === 'login' ? 'Logging in failed. Please try again.' : 'Creating the account failed. Please try again.';
}
