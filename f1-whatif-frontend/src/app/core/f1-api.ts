import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  DriverPhoto,
  DriverSeasonResponse,
  RaceInfo,
  RulesetDetail,
  RulesetSummary,
  SeasonDriver,
  SeasonSummary,
  StandingsQuery,
  StandingsResponse,
} from './models';

/** Typed access to the public, read-only endpoints of the backend. */
@Injectable({ providedIn: 'root' })
export class F1Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  seasons(): Observable<SeasonSummary[]> {
    return this.http.get<SeasonSummary[]>(`${this.baseUrl}/seasons`);
  }

  rulesets(): Observable<RulesetSummary[]> {
    return this.http.get<RulesetSummary[]>(`${this.baseUrl}/rulesets`);
  }

  ruleset(code: string): Observable<RulesetDetail> {
    return this.http.get<RulesetDetail>(`${this.baseUrl}/rulesets/${encodeURIComponent(code)}`);
  }

  races(year: number): Observable<RaceInfo[]> {
    return this.http.get<RaceInfo[]>(`${this.baseUrl}/seasons/${year}/races`);
  }

  drivers(year: number): Observable<SeasonDriver[]> {
    return this.http.get<SeasonDriver[]>(`${this.baseUrl}/seasons/${year}/drivers`);
  }

  standings(query: StandingsQuery): Observable<StandingsResponse> {
    let params = new HttpParams()
      .set('ruleset', query.ruleset)
      .set('includeSprints', String(query.includeSprints));
    if (query.countBest !== null) {
      params = params.set('countBest', String(query.countBest));
    }
    if (query.excludeDrivers.length > 0) {
      params = params.set('excludeDrivers', query.excludeDrivers.join(','));
    }
    if (query.excludeRaces.length > 0) {
      params = params.set('excludeRaces', query.excludeRaces.join(','));
    }
    return this.http.get<StandingsResponse>(`${this.baseUrl}/seasons/${query.year}/standings`, {
      params,
    });
  }

  driverSeason(year: number, driverId: number): Observable<DriverSeasonResponse> {
    return this.http.get<DriverSeasonResponse>(`${this.baseUrl}/seasons/${year}/drivers/${driverId}/results`);
  }

  driverPhoto(driverId: number): Observable<DriverPhoto> {
    return this.http.get<DriverPhoto>(`${this.baseUrl}/drivers/${driverId}/photo`);
  }
}
