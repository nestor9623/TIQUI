import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-timeout-modal.component.html',
  styleUrls: ['./session-timeout-modal.component.scss']
})
export class SessionTimeoutModalComponent {

  @Input() remainingSeconds: number = 0;
  @Input() isVisible: boolean = false;

  @Output() logout = new EventEmitter<void>();
  @Output() extendSession = new EventEmitter<void>();

  /**
   * Formatea los segundos a mm:ss
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Maneja la extensión de sesión
   */
  onExtendSession(): void {
    this.extendSession.emit();
  }

  /**
   * Maneja el logout
   */
  onLogout(): void {
    this.logout.emit();
  }

  /**
   * Retorna la clase CSS según el tiempo restante
   */
  getTimeWarningClass(): string {
    if (this.remainingSeconds <= 30) {
      return 'critical';
    } else if (this.remainingSeconds <= 60) {
      return 'warning';
    }
    return 'normal';
  }
}
