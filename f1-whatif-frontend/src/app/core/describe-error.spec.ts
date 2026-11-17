import { HttpErrorResponse } from '@angular/common/http';
import { describeError } from './describe-error';

describe('describeError', () => {
  it('explains that the server cannot be reached', () => {
    expect(describeError(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
  });

  it('explains a missing resource', () => {
    expect(describeError(new HttpErrorResponse({ status: 404 }))).toBe('No data found for this selection.');
  });

  it('explains rate limiting', () => {
    expect(describeError(new HttpErrorResponse({ status: 429 }))).toContain('Too many requests');
  });

  it('includes the status of other server errors', () => {
    expect(describeError(new HttpErrorResponse({ status: 500 }))).toContain('500');
  });

  it('copes with errors that are not HTTP errors', () => {
    expect(describeError(new Error('x'))).toBe('Something went wrong.');
  });
});
