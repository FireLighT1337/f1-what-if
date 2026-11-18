import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { F1Api } from './f1-api';

describe('F1Api', () => {
  let api: F1Api;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(F1Api);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the list of seasons', () => {
    api.seasons().subscribe();

    http.expectOne('/api/seasons').flush([]);
  });

  it('requests the details of a points system by code', () => {
    api.ruleset('classic-1961').subscribe();

    http.expectOne('/api/rulesets/classic-1961').flush({});
  });

  it('requests the races and drivers of a season', () => {
    api.races(1984).subscribe();
    api.drivers(1984).subscribe();

    http.expectOne('/api/seasons/1984/races').flush([]);
    http.expectOne('/api/seasons/1984/drivers').flush([]);
  });

  it('sends only the options that are set when asking for standings', () => {
    api.standings({
      year: 2018,
      ruleset: 'modern-2010',
      includeSprints: false,
      countBest: null,
      excludeDrivers: [],
      excludeRaces: [],
    }).subscribe();

    const request = http.expectOne((r) => r.url === '/api/seasons/2018/standings');
    expect(request.request.params.get('ruleset')).toBe('modern-2010');
    expect(request.request.params.get('includeSprints')).toBe('false');
    expect(request.request.params.has('countBest')).toBe(false);
    expect(request.request.params.has('excludeDrivers')).toBe(false);
    expect(request.request.params.has('excludeRaces')).toBe(false);
    request.flush({ season: 2018, ruleset: 'modern-2010', standings: [] });
  });

  it('sends exclusions as comma separated ids', () => {
    api.standings({
      year: 1984,
      ruleset: 'classic-1961',
      includeSprints: true,
      countBest: 11,
      excludeDrivers: [3, 7],
      excludeRaces: [60],
    }).subscribe();

    const request = http.expectOne((r) => r.url === '/api/seasons/1984/standings');
    expect(request.request.params.get('countBest')).toBe('11');
    expect(request.request.params.get('excludeDrivers')).toBe('3,7');
    expect(request.request.params.get('excludeRaces')).toBe('60');
    request.flush({ season: 1984, ruleset: 'classic-1961', standings: [] });
  });

  it('requests how a driver finished a season', () => {
    api.driverSeason(1984, 2).subscribe();

    http.expectOne('/api/seasons/1984/drivers/2/results').flush({});
  });

  it('requests the photo of a driver', () => {
    api.driverPhoto(2).subscribe();

    http.expectOne('/api/drivers/2/photo').flush({});
  });
});
