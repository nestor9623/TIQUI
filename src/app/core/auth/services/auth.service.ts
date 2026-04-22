import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse, AuthState, LoginCredentials, TokenPayload, User } from '../models/auth.model';
import { TokenService } from './token.service';
import { AuthMockService } from '../../mock/auth-mock.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authState = signal<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null
  });

  readonly auth = this.authState.asReadonly();
  readonly auth$: Observable<AuthState> = toObservable(this.authState);

  constructor(
    private tokenService: TokenService,
    private authMock: AuthMockService
  ) {
    this.initializeAuth();
  }

  /**
   * Inicializa el estado de autenticación al cargar la app
   */
  private initializeAuth(): void {
    if (this.tokenService.hasValidToken()) {
      const token = this.tokenService.getToken();
      if (token) {
        const payload = this.tokenService.decodeToken(token);
        if (payload) {
          this.updateAuthState({
            user: this.mapPayloadToUser(payload),
            token,
            refreshToken: this.tokenService.getRefreshToken(),
            isAuthenticated: true,
            loading: false,
            error: null
          });
        }
      }
    }
  }

  /**
   * Login
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.updateAuthState({ loading: true, error: null });

    return this.authMock.login(credentials).pipe(
      tap({
        next: (response: AuthResponse) => this.handleAuthResponse(response),
        error: (error: { message?: string } | null) => this.handleAuthError(error)
      })
    );
  }

  /**
   * Refresh token
   */
  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return new Observable(observer => observer.error('No refresh token'));
    }

    return this.authMock.refreshToken(refreshToken).pipe(
      tap({
        next: (response: AuthResponse) => this.handleAuthResponse(response),
        error: () => this.logout()
      })
    );
  }

  /**
   * Logout
   */
  logout(): void {
    this.tokenService.clearTokens();
    this.updateAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.authState().user;
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return this.authState().token;
  }

  /**
   * Verifica si está autenticado
   */
  isAuthenticated(): boolean {
    return this.authState().isAuthenticated && this.tokenService.hasValidToken();
  }

  /**
   * Maneja la respuesta de autenticación
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.tokenService.setToken(response.token, response.expiresIn);
    this.tokenService.setRefreshToken(response.refreshToken);

    this.updateAuthState({
      user: response.user,
      token: response.token,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      loading: false,
      error: null
    });
  }

  /**
   * Maneja errores de autenticación
   */
  private handleAuthError(error: { message?: string } | null): void {
    const errorMessage = error?.message || 'Error de autenticación';
    this.updateAuthState({
      loading: false,
      error: errorMessage
    });
  }

  private mapPayloadToUser(payload: TokenPayload): User {
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
      role: payload.role,
      active: payload.active ?? true,
      address: payload.address,
      area: payload.area,
      community: payload.community,
      weeklyHoursTarget: payload.weeklyHoursTarget,
      managerId: payload.managerId,
    };
  }

  /**
   * Actualiza el estado de autenticación
   */
  private updateAuthState(partial: Partial<AuthState>): void {
    this.authState.update(current => ({ ...current, ...partial }));
  }
}
