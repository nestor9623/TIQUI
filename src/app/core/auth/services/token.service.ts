import { Injectable } from '@angular/core';
import { TokenPayload } from '../models/auth.model';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  /**
   * Guarda el token de acceso
   */
  setToken(token: string, expiresIn: number): void {
    const expiryTime = new Date().getTime() + expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  /**
   * Obtiene el token de acceso
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Guarda el refresh token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * Obtiene el refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Obtiene el tiempo de expiración del token
   */
  getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return new Date().getTime() >= expiry;
  }

  /**
   * Obtiene los segundos restantes para expiración
   */
  getTimeUntilExpiry(): number {
    const expiry = this.getTokenExpiry();
    if (!expiry) return 0;
    const remaining = Math.floor((expiry - new Date().getTime()) / 1000);
    return Math.max(0, remaining);
  }

  /**
   * Decodifica el JWT (sin verificar firma)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Limpia todos los tokens
   */
  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  /**
   * Verifica si hay un token válido
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }
}
