import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { AuthResponse, AuthState, LoginCredentials, User } from '../models/auth.model';
import { TokenService } from './token.service';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authState = signal<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  readonly auth = this.authState.asReadonly();
  readonly auth$: Observable<AuthState> = toObservable(this.authState);

  constructor(
    private tokenService: TokenService,
    private supabaseAuth: SupabaseAuthService,
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    if (this.tokenService.hasValidToken()) {
      const token = this.tokenService.getToken();
      if (token) {
        const payload = this.tokenService.decodeToken(token);
        if (payload) {
          this.updateAuthState({
            user: {
              id: payload.sub,
              email: payload.email,
              firstName: payload.firstName ?? '',
              lastName: payload.lastName ?? '',
              role: payload.role,
              active: payload.active ?? true,
              loginMethod: payload.loginMethod ?? 'local',
              azureConnected: payload.azureConnected ?? false,
              address: payload.address,
              area: payload.area,
              community: payload.community,
              weeklyHoursTarget: payload.weeklyHoursTarget,
              managerId: payload.managerId,
            },
            token,
            refreshToken: this.tokenService.getRefreshToken(),
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        }
      }
    }

    // Always hydrate from Supabase so reloads recover the full profile
    // even when the access token payload is incomplete.
    this.supabaseAuth.restoreSession().subscribe({
      next: response => {
        if (response) {
          this.handleAuthResponse(response);
        }
      },
    });
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.updateAuthState({ loading: true, error: null });
    return this.supabaseAuth.login(credentials).pipe(
      tap({
        next: (response: AuthResponse) => this.handleAuthResponse(response),
        error: (error: { message?: string } | null) => this.handleAuthError(error),
      }),
    );
  }

  loginWithMicrosoft(returnUrl?: string): Observable<void> {
    this.updateAuthState({ loading: true, error: null });
    return this.supabaseAuth.loginWithMicrosoft(returnUrl).pipe(
      tap({
        next: () => this.updateAuthState({ loading: false }),
        error: (error: { message?: string } | null) => this.handleAuthError(error),
      }),
    );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return new Observable(observer => observer.error('No refresh token'));
    }
    return this.supabaseAuth.refreshToken(refreshToken).pipe(
      tap({
        next: (response: AuthResponse) => this.handleAuthResponse(response),
        error: () => this.logout(),
      }),
    );
  }

  logout(): void {
    this.supabaseAuth.logout().subscribe();
    this.tokenService.clearTokens();
    this.updateAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }

  getCurrentUser(): User | null {
    return this.authState().user;
  }

  getToken(): string | null {
    return this.authState().token;
  }

  isAuthenticated(): boolean {
    return this.authState().isAuthenticated && this.tokenService.hasValidToken();
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.tokenService.setToken(response.token, response.expiresIn);
    this.tokenService.setRefreshToken(response.refreshToken);
    this.updateAuthState({
      user: response.user,
      token: response.token,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  }

  private handleAuthError(error: { message?: string } | null): void {
    this.updateAuthState({ loading: false, error: error?.message ?? 'Error de autenticación' });
  }

  private updateAuthState(partial: Partial<AuthState>): void {
    this.authState.update(current => ({ ...current, ...partial }));
  }
}

