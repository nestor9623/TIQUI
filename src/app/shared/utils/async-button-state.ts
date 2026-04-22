import { computed, signal } from '@angular/core';

/**
 * Gestiona el estado de un botón de acción asíncrona.
 *
 * - Mientras la acción está en curso: botón deshabilitado.
 * - Tras un error: botón deshabilitado durante `cooldownMs` (por defecto 4s)
 *   para evitar spam de llamadas.
 * - Tras éxito: se resetea sin cooldown.
 *
 * Uso en un componente:
 * ```ts
 * readonly submitState = new AsyncButtonState();
 *
 * onSubmit() {
 *   if (this.submitState.disabled()) return; // guard extra
 *   this.submitState.start();
 *   someService.call().subscribe({
 *     next: () => this.submitState.success(),
 *     error: () => this.submitState.error(),
 *   });
 * }
 * ```
 * En el template:
 * ```html
 * <button [disabled]="submitState.disabled()">Enviar</button>
 * ```
 */
export class AsyncButtonState {
  private readonly _loading = signal(false);
  private readonly _cooling = signal(false);
  private _cooldownTimer: ReturnType<typeof setTimeout> | null = null;

  /** true mientras la petición está en vuelo */
  readonly loading = this._loading.asReadonly();

  /** true mientras está en cooldown post-error */
  readonly cooling = this._cooling.asReadonly();

  /** true si el botón debe estar deshabilitado (loading O cooldown) */
  readonly disabled = computed(() => this._loading() || this._cooling());

  /** Llama al inicio de la petición */
  start(): void {
    this._clearTimer();
    this._loading.set(true);
    this._cooling.set(false);
  }

  /** Llama cuando la petición termina con éxito */
  success(): void {
    this._loading.set(false);
    this._cooling.set(false);
    this._clearTimer();
  }

  /**
   * Llama cuando la petición falla.
   * @param cooldownMs milisegundos que el botón permanece deshabilitado (default 4000)
   */
  error(cooldownMs = 4000): void {
    this._loading.set(false);
    this._cooling.set(true);
    this._clearTimer();
    this._cooldownTimer = setTimeout(() => this._cooling.set(false), cooldownMs);
  }

  /** Resetea el estado sin cooldown (por ejemplo, al limpiar el formulario) */
  reset(): void {
    this._loading.set(false);
    this._cooling.set(false);
    this._clearTimer();
  }

  private _clearTimer(): void {
    if (this._cooldownTimer !== null) {
      clearTimeout(this._cooldownTimer);
      this._cooldownTimer = null;
    }
  }
}
