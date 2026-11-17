import { HttpErrorResponse } from '@angular/common/http';

/** Turns whatever a failed request threw into a short message for the user. */
export function describeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0:
        return 'Cannot reach the server. Check your connection and try again.';
      case 404:
        return 'No data found for this selection.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return `Something went wrong (error ${error.status}).`;
    }
  }
  return 'Something went wrong.';
}
