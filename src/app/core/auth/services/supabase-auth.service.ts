import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthResponse, LoginCredentials, User, UserRole } from '../../auth/models/auth.model';
import { SupabaseClientService } from '../../infraestructure/supabase/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private readonly supabase = inject(SupabaseClientService).client;

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(
      this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      }),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.session || !data.user) {
          return throwError(() => ({
            code: error?.code ?? 'AUTH_ERROR',
            message: error?.message ?? 'Error de autenticación',
          }));
        }
        return from(
          this.supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single(),
        ).pipe(
          map(({ data: profile, error: profileError }) => {
            if (profileError || !profile) {
              throw { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' };
            }
            if (!profile.active) {
              throw { code: 'USER_INACTIVE', message: 'Tu cuenta está inactiva. Contacta con administración.' };
            }
            const user: User = this.mapProfileToUser(profile);
            return {
              token: data.session!.access_token,
              refreshToken: data.session!.refresh_token,
              user,
              expiresIn: data.session!.expires_in ?? 3600,
            } satisfies AuthResponse;
          }),
        );
      }),
    );
  }

  loginWithMicrosoft(returnUrl?: string): Observable<void> {
    const redirectTo = returnUrl
      ? `${window.location.origin}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : `${window.location.origin}/auth/login`;

    return from(
      this.supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo,
          scopes: 'openid profile email offline_access',
          skipBrowserRedirect: true,
        },
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          const rawMessage = error.message ?? 'No se pudo iniciar Microsoft 365';
          const providerDisabled = /unsupported provider|provider is not enabled/i.test(rawMessage);

          throw {
            code: error.code ?? 'MICROSOFT_AUTH_ERROR',
            message: providerDisabled
              ? 'Microsoft 365 no está configurado en Supabase (Auth > Providers > Azure). Activa el proveedor y vuelve a intentar.'
              : rawMessage,
          };
        }
        if (data?.url) {
          window.location.href = data.url;
        }
      }),
    );
  }

  restoreSession(): Observable<AuthResponse | null> {
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.session) {
          return of(null);
        }

        const session = data.session;
        return from(
          this.supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        ).pipe(
          map(({ data: profile, error: profileError }) => {
            if (profileError || !profile || !profile.active) {
              return null;
            }

            const provider = String(session.user.app_metadata?.provider ?? '').toLowerCase();
            return {
              token: session.access_token,
              refreshToken: session.refresh_token,
              user: this.mapProfileToUser(profile, provider),
              expiresIn: session.expires_in ?? 3600,
            } satisfies AuthResponse;
          }),
        );
      }),
    );
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return from(this.supabase.auth.refreshSession({ refresh_token: refreshToken })).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.session || !data.user) {
          return throwError(() => ({ code: 'REFRESH_FAILED', message: 'No se pudo renovar la sesión' }));
        }
        return from(
          this.supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        ).pipe(
          map(({ data: profile, error: profileError }) => {
            if (profileError || !profile) {
              throw { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' };
            }
            return {
              token: data.session!.access_token,
              refreshToken: data.session!.refresh_token,
              user: this.mapProfileToUser(profile),
              expiresIn: data.session!.expires_in ?? 3600,
            } satisfies AuthResponse;
          }),
        );
      }),
    );
  }

  logout(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(map(() => undefined));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapProfileToUser(profile: any, provider: string = 'local'): User {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role as UserRole,
      active: profile.active,
      loginMethod: provider === 'azure' ? 'microsoft' : 'local',
      azureConnected: provider === 'azure' || Boolean(profile.azure_connected),
      address: profile.address ?? undefined,
      area: profile.area ?? undefined,
      community: profile.community ?? undefined,
      weeklyHoursTarget: profile.weekly_hours_target ?? undefined,
      managerId: profile.manager_id ?? undefined,
      isTeamLeader: Boolean(profile.is_team_leader),
      vacationDates: profile.vacation_dates ?? [],
      avatar: profile.avatar ?? undefined,
    };
  }
}
