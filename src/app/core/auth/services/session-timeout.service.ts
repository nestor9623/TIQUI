import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TokenService } from './token.service';

const TIMEOUT_DURATION = 120; // 2 minutos de inactividad
const CHECK_INTERVAL = 1000; // Verifica cada 1 segundo
const WARNING_TIME = 60; // Muestra advertencia 1 minuto antes

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private readonly activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
  private readonly boundOnUserActivity = (event: Event) => this.onUserActivity(event);

  private sessionTimeoutSubject = new BehaviorSubject<number>(0);
  public sessionTimeout$: Observable<number> = this.sessionTimeoutSubject.asObservable()
    .pipe(debounceTime(100), distinctUntilChanged());

  private showTimeoutWarningSubject = new BehaviorSubject<boolean>(false);
  public showTimeoutWarning$: Observable<boolean> = this.showTimeoutWarningSubject.asObservable();

  private inactivityTimer: Subscription | null = null;
  private checkTimeoutIntervalSubscription: Subscription | null = null;
  private lastActivityTime = Date.now();

  constructor(
    private tokenService: TokenService,
    private ngZone: NgZone
  ) {}

  /**
   * Inicia el monitoreo de sesión
   */
  startSessionMonitoring(): void {
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
    }

    if (this.checkTimeoutIntervalSubscription) {
      this.checkTimeoutIntervalSubscription.unsubscribe();
    }

    // Registra actividad del usuario
    this.registerUserActivityListeners();

    // Sincroniza el contador de inmediato y luego verifica periódicamente
    this.checkSessionTimeout();
    this.startTokenCheckInterval();
  }

  /**
   * Detiene el monitoreo de sesión
   */
  stopSessionMonitoring(): void {
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
      this.inactivityTimer = null;
    }

    if (this.checkTimeoutIntervalSubscription) {
      this.checkTimeoutIntervalSubscription.unsubscribe();
      this.checkTimeoutIntervalSubscription = null;
    }

    this.removeUserActivityListeners();
  }

  /**
   * Refuerza la sesión (después de login o reactivación)
   */
  resetInactivityTimer(): void {
    this.lastActivityTime = Date.now();
    this.showTimeoutWarningSubject.next(false);
    this.sessionTimeoutSubject.next(TIMEOUT_DURATION);
  }

  /**
   * Registra oyentes de actividad del usuario
   */
  private registerUserActivityListeners(): void {
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.boundOnUserActivity, true);
    });
  }

  /**
   * Elimina oyentes de actividad
   */
  private removeUserActivityListeners(): void {
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.boundOnUserActivity, true);
    });
  }

  /**
   * Callback de actividad del usuario
   */
  private onUserActivity(event: Event): void {
    // Ignora eventos de la modal de timeout
    const target = event.target;
    if (target instanceof Element && target.closest('.session-timeout-modal')) {
      return;
    }

    this.lastActivityTime = Date.now();
    this.showTimeoutWarningSubject.next(false);
  }

  /**
   * Inicia la verificación periódica del token
   */
  private startTokenCheckInterval(): void {
    this.checkTimeoutIntervalSubscription = interval(CHECK_INTERVAL).subscribe(() => {
      this.ngZone.run(() => {
        this.checkSessionTimeout();
      });
    });
  }

  /**
   * Verifica si la sesión ha expirado o está a punto de expirar
   */
  private checkSessionTimeout(): void {
    const inactivityTime = Date.now() - this.lastActivityTime;
    const timeUntilTokenExpiry = this.tokenService.getTimeUntilExpiry();

    // Si el token expiró
    if (timeUntilTokenExpiry <= 0) {
      this.sessionTimeoutSubject.next(0);
      this.showTimeoutWarningSubject.next(false);
      return;
    }

    // Si pasó el timeout de inactividad
    const timeoutSeconds = TIMEOUT_DURATION - Math.floor(inactivityTime / 1000);
    if (timeoutSeconds <= 0) {
      this.sessionTimeoutSubject.next(0);
      this.showTimeoutWarningSubject.next(false);
      return;
    }

    // Muestra advertencia cuando faltan 60 segundos o menos
    if (timeoutSeconds <= WARNING_TIME) {
      this.showTimeoutWarningSubject.next(true);
    } else {
      this.showTimeoutWarningSubject.next(false);
    }

    this.sessionTimeoutSubject.next(timeoutSeconds);
  }

  /**
   * Obtiene los segundos restantes para timeout
   */
  getTimeoutCountdown(): number {
    return this.sessionTimeoutSubject.value;
  }

  /**
   * Obtiene el estado de mostrar advertencia
   */
  isShowingWarning(): boolean {
    return this.showTimeoutWarningSubject.value;
  }
}
