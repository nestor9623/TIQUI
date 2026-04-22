import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
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
  private mapProfileToUser(profile: any): User {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role as UserRole,
      active: profile.active,
      address: profile.address ?? undefined,
      area: profile.area ?? undefined,
      community: profile.community ?? undefined,
      weeklyHoursTarget: profile.weekly_hours_target ?? undefined,
      managerId: profile.manager_id ?? undefined,
      vacationDates: profile.vacation_dates ?? [],
      avatar: profile.avatar ?? undefined,
    };
  }
}
