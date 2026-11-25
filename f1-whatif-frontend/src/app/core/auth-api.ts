import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { TokenResponse, UserInfo } from './models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  register(username: string, password: string): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.baseUrl}/auth/register`, { username, password });
  }

  login(username: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/auth/login`, { username, password });
  }

  /** Who the stored token belongs to; also shows whether the token is still valid. */
  me(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.baseUrl}/auth/me`);
  }
}
