import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { TokenService } from './token.service';

export interface ApiResponse<T> {
  succeeded: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileResponse {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface UserDropdownResponse {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: UserProfileResponse;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/Auth`;
  private readonly USER_STORAGE_KEY = 'tasktracker-user';
  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
  ) {}

  currentUser(): User | null {
    return this.currentUserSignal();
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken() && !!this.currentUser();
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request)
      .pipe(tap((response) => this.persistAuth(response.data)));
  }

  listUsers(): Observable<ApiResponse<UserDropdownResponse[]>> {
    return this.http.get<ApiResponse<UserDropdownResponse[]>>(`${this.apiUrl}/listuser`);
  }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request)
      .pipe(tap((response) => this.persistAuth(response.data)));
  }

  refreshToken(refreshToken: string): Observable<ApiResponse<AuthResponse>> {
    const request: RefreshTokenRequest = { refreshToken };

    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/refresh-token`, request)
      .pipe(tap((response) => this.persistAuth(response.data)));
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (refreshToken) {
      const request: LogoutRequest = { refreshToken };
      this.http.post<ApiResponse<null>>(`${this.apiUrl}/logout`, request).subscribe({
        error: () => undefined,
      });
    }

    this.clearSession();
  }

  getCurrentUser(): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.apiUrl}/me`).pipe(
      tap((response) => {
        const user = this.mapUserProfile(response.data);
        this.currentUserSignal.set(user);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      }),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/change-password`, request);
  }

  private persistAuth(auth: AuthResponse): void {
    const user = this.mapUserProfile(auth.user);
    this.tokenService.saveTokens(auth.accessToken, auth.refreshToken);
    this.currentUserSignal.set(user);
    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    this.tokenService.clearTokens();
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.USER_STORAGE_KEY);
  }

  private readStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private mapUserProfile(user: UserProfileResponse): User {
    return {
      id: user.userId,
      name: user.fullName,
      email: user.email,
      role: this.normalizeRole(user.role),
    };
  }

  private normalizeRole(role: string): User['role'] {
    return role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
  }
}
