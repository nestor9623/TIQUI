/**
 * Auth Models - Modelos de datos para autenticación
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  loginMethod?: 'local' | 'microsoft';
  azureConnected?: boolean;
  address?: string;
  area?: string;
  community?: 'madrid' | 'galicia';
  weeklyHoursTarget?: number;
  managerId?: string | null;
  isTeamLeader?: boolean;
  vacationDates?: string[];
  avatar?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager'
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  loginMethod?: 'local' | 'microsoft';
  azureConnected?: boolean;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  address?: string;
  area?: string;
  community?: 'madrid' | 'galicia';
  weeklyHoursTarget?: number;
  managerId?: string | null;
  isTeamLeader?: boolean;
  iat: number;
  exp: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
