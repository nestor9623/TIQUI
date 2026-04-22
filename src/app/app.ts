import { Component, OnInit, OnDestroy, signal, NgZone } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionTimeoutModalComponent } from './features/auth/components/session-timeout-modal/session-timeout-modal.component';
import { AuthService } from './core/auth/services/auth.service';
import { SessionTimeoutService } from './core/auth/services/session-timeout.service';
import { Subscription } from 'rxjs';
import { AppAlertCenterComponent } from './shared/ui/app-alert-center/app-alert-center';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SessionTimeoutModalComponent, AppAlertCenterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {

  showSessionTimeoutModal = signal(false);
  remainingSeconds = signal(0);
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private sessionTimeoutService: SessionTimeoutService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Inicia el monitoreo de sesión si está autenticado
    if (this.authService.isAuthenticated()) {
      this.sessionTimeoutService.startSessionMonitoring();
    }

    // Suscribirse a cambios de autenticación
    this.subscriptions.push(
      this.authService.auth$.subscribe(auth => {
        if (auth.isAuthenticated) {
          this.sessionTimeoutService.startSessionMonitoring();
        } else {
          this.sessionTimeoutService.stopSessionMonitoring();
        }
      }),

      // Suscribirse a cambios de timeout
      this.sessionTimeoutService.sessionTimeout$.subscribe(seconds => {
        this.ngZone.run(() => {
          this.remainingSeconds.set(seconds);
          if (seconds === 0) {
            this.handleSessionTimeout();
          }
        });
      }),

      // Suscribirse a advertencia de timeout
      this.sessionTimeoutService.showTimeoutWarning$.subscribe(show => {
        this.ngZone.run(() => {
          this.showSessionTimeoutModal.set(show);
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.sessionTimeoutService.stopSessionMonitoring();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Maneja la expiración de la sesión
   */
  private handleSessionTimeout(): void {
    this.authService.logout();
    this.showSessionTimeoutModal.set(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Extiende la sesión (refresh token)
   */
  onExtendSession(): void {
    this.authService.refreshAccessToken().subscribe({
      next: () => {
        this.sessionTimeoutService.resetInactivityTimer();
      },
      error: (error) => {
        console.error('Error refreshing token:', error);
        this.handleSessionTimeout();
      }
    });
  }

  /**
   * Logout desde el modal
   */
  onLogout(): void {
    this.handleSessionTimeout();
  }
}
