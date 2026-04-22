import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, switchMap, throwError } from 'rxjs';
import { AuthResponse, LoginCredentials, UserRole } from '../auth/models/auth.model';
import { TokenService } from '../auth/services/token.service';
import { ManagedUserRecord, MockUsersService } from './services/mock-users.service';

/**
 * Mock Auth Service - Simula el backend de autenticación
 * Genera JWT mock tokens para desarrollo
 */
@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
  private readonly usersService = inject(MockUsersService);
  private readonly tokenService = inject(TokenService);

  /**
   * Credenciales demo para UI
   */
  getDemoCredentials(): Array<{ email: string; password: string; role: string }> {
    return [
      { email: 'admin@tiqui.com', password: 'admin123', role: 'ADMIN' },
      { email: 'manager@tiqui.com', password: 'manager123', role: 'MANAGER' },
      { email: 'employee@tiqui.com', password: 'employee123', role: 'EMPLOYEE' },
    ];
  }

  /**
   * Simula el login con credenciales
   * Token expira en 5 minutos (300 segundos)
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.getMockUsers().pipe(
      map(users => users.find(user => user.email === credentials.email && user.password === credentials.password) ?? null),
      switchMap(user => {
        if (!user) {
          return throwError(() => ({
            code: 'INVALID_CREDENTIALS',
            message: 'Email o contraseña inválidos',
          }));
        }

        if (!user.active) {
          return throwError(() => ({
            code: 'USER_INACTIVE',
            message: 'Tu cuenta está inactiva. Contacta con administración.',
          }));
        }

        const response: AuthResponse = {
          token: this.generateMockJWT(user),
          refreshToken: this.generateRefreshToken(),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            active: user.active,
            address: user.address,
            area: user.area,
            community: user.community,
            weeklyHoursTarget: user.weeklyHoursTarget,
            managerId: user.managerId,
            vacationDates: user.vacationDates,
          },
          expiresIn: 300,
        };

        return of(response).pipe(delay(450));
      }),
    );
  }

  /**
   * Simula el refresh del token
   */
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.getMockUsers().pipe(
      map(users => {
        const currentToken = this.tokenService.getToken();
        const payload = currentToken ? this.tokenService.decodeToken(currentToken) : null;
        return users.find(user => user.id === payload?.sub) ?? users[0];
      }),
      map(mockUser => ({
        token: this.generateMockJWT(mockUser),
        refreshToken: this.generateRefreshToken(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          active: mockUser.active,
          address: mockUser.address,
          area: mockUser.area,
          community: mockUser.community,
          weeklyHoursTarget: mockUser.weeklyHoursTarget,
          managerId: mockUser.managerId,
          vacationDates: mockUser.vacationDates,
        },
        expiresIn: 300,
      })),
      delay(350),
    );
  }

  /**
   * Genera un JWT mock
   * Formato: header.payload.signature (signature es fake)
   */
  private generateMockJWT(user: ManagedUserRecord): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 300; // 5 minutos

    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      active: user.active,
      address: user.address,
      area: user.area,
      community: user.community,
      weeklyHoursTarget: user.weeklyHoursTarget,
      managerId: user.managerId,
      iat: now,
      exp: now + expiresIn
    }));

    // Signature simulada (no es criptográfica)
    const signature = btoa('mock-signature-' + Math.random().toString());

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Genera un refresh token mock
   */
  private generateRefreshToken(): string {
    return 'refresh_' + btoa(Math.random().toString()).substring(0, 32);
  }

  private getMockUsers(): Observable<ManagedUserRecord[]> {
    return this.usersService.getUsers();
  }

  private normalizeRole(role: string): UserRole {
    if (role === UserRole.ADMIN || role.toUpperCase() === 'ADMIN') {
      return UserRole.ADMIN;
    }
    if (role === UserRole.MANAGER || role.toUpperCase() === 'MANAGER') {
      return UserRole.MANAGER;
    }
    return UserRole.EMPLOYEE;
  }
}
