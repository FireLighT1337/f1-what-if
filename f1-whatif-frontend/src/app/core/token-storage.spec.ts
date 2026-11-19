import { TestBed } from '@angular/core/testing';
import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = TestBed.inject(TokenStorage);
  });

  it('gives back a saved session that is still valid', () => {
    const session = { token: 'abc', expiresAt: Date.now() + 60_000 };

    storage.save(session);

    expect(storage.load()).toEqual(session);
  });

  it('forgets a session that has expired', () => {
    storage.save({ token: 'abc', expiresAt: Date.now() - 1 });

    expect(storage.load()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('ignores stored data that is not a session', () => {
    localStorage.setItem('f1whatif.session', '{"token": 5}');
    expect(storage.load()).toBeNull();

    localStorage.setItem('f1whatif.session', 'not json');
    expect(storage.load()).toBeNull();
  });

  it('clears the session', () => {
    storage.save({ token: 'abc', expiresAt: Date.now() + 60_000 });

    storage.clear();

    expect(storage.load()).toBeNull();
  });

  it('copes with storage that refuses to work', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => storage.save({ token: 'abc', expiresAt: Date.now() + 60_000 })).not.toThrow();
    expect(storage.load()).toBeNull();
    vi.restoreAllMocks();
  });
});
