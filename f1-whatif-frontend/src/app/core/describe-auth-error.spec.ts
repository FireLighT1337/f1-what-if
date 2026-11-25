import { HttpErrorResponse } from '@angular/common/http';
import { describeAuthError } from './describe-auth-error';

const status = (code: number) => new HttpErrorResponse({ status: code });

describe('describeAuthError', () => {
  it('explains the common failures', () => {
    expect(describeAuthError(status(401), 'login')).toBe('Invalid username or password.');
    expect(describeAuthError(status(409), 'register')).toBe('That username is already taken.');
    expect(describeAuthError(status(429), 'login')).toContain('Too many attempts');
    expect(describeAuthError(status(400), 'register')).toContain('username');
    expect(describeAuthError(status(0), 'login')).toContain('Cannot reach the server');
  });

  it('falls back to a message that fits the form', () => {
    expect(describeAuthError(status(500), 'login')).toBe('Logging in failed. Please try again.');
    expect(describeAuthError(new Error('x'), 'register')).toBe('Creating the account failed. Please try again.');
  });
});
