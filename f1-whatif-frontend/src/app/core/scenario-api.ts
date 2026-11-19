import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { ScenarioRequest, ScenarioResponse, StandingsResponse } from './models';

/** Saved scenarios. Everything except the shared views needs a logged-in user. */
@Injectable({ providedIn: 'root' })
export class ScenarioApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<ScenarioResponse[]> {
    return this.http.get<ScenarioResponse[]>(`${this.baseUrl}/scenarios`);
  }

  create(request: ScenarioRequest): Observable<ScenarioResponse> {
    return this.http.post<ScenarioResponse>(`${this.baseUrl}/scenarios`, request);
  }

  update(id: number, request: ScenarioRequest): Observable<ScenarioResponse> {
    return this.http.put<ScenarioResponse>(`${this.baseUrl}/scenarios/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/scenarios/${id}`);
  }

  share(id: number): Observable<ScenarioResponse> {
    return this.http.post<ScenarioResponse>(`${this.baseUrl}/scenarios/${id}/share`, {});
  }

  unshare(id: number): Observable<ScenarioResponse> {
    return this.http.delete<ScenarioResponse>(`${this.baseUrl}/scenarios/${id}/share`);
  }

  /** A shared scenario by its public id; no login needed. */
  shared(publicId: string): Observable<ScenarioResponse> {
    return this.http.get<ScenarioResponse>(`${this.baseUrl}/shared/${encodeURIComponent(publicId)}`);
  }

  sharedStandings(publicId: string): Observable<StandingsResponse> {
    return this.http.get<StandingsResponse>(`${this.baseUrl}/shared/${encodeURIComponent(publicId)}/standings`);
  }
}
