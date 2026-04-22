import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { AuthResponse } from '../models/auth.model';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  intercept(
    request: HttpRequest<object>,
    next: HttpHandler
  ): Observable<HttpEvent<object>> {
    const token = this.tokenService.getToken();

    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Agrega el token al header de la solicitud
   */
  private addToken<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Maneja errores 401 (Unauthorized)
   */
  private handle401Error(
    request: HttpRequest<object>,
    next: HttpHandler
  ): Observable<HttpEvent<object>> {
    // Intenta refrescar el token
    return this.authService.refreshAccessToken().pipe(
      switchMap((response: AuthResponse) => {
        const newToken = response.token;
        return next.handle(this.addToken(request, newToken));
      }),
      catchError(error => {
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}
