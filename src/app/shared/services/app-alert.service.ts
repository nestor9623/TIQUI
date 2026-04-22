import { Injectable, signal } from '@angular/core';

export type AppAlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AppAlertItem {
  id: string;
  tone: AppAlertTone;
  title: string;
  message: string;
  dismissible: boolean;
}

export interface AppAlertInput {
  tone?: AppAlertTone;
  title: string;
  message: string;
  durationMs?: number;
  dismissible?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppAlertService {
  private readonly alertsState = signal<AppAlertItem[]>([]);
  private readonly timeoutById = new Map<string, ReturnType<typeof setTimeout>>();

  readonly alerts = this.alertsState.asReadonly();

  show(input: AppAlertInput): string {
    const id = this.createId();
    const alert: AppAlertItem = {
      id,
      tone: input.tone ?? 'info',
      title: input.title,
      message: input.message,
      dismissible: input.dismissible ?? true,
    };

    this.alertsState.update(current => [...current, alert]);

    const durationMs = input.durationMs ?? this.resolveDefaultDuration(alert.tone);
    if (durationMs > 0) {
      const timeout = setTimeout(() => this.dismiss(id), durationMs);
      this.timeoutById.set(id, timeout);
    }

    return id;
  }

  success(title: string, message: string, durationMs?: number): string {
    return this.show({ tone: 'success', title, message, durationMs });
  }

  info(title: string, message: string, durationMs?: number): string {
    return this.show({ tone: 'info', title, message, durationMs });
  }

  warning(title: string, message: string, durationMs?: number): string {
    return this.show({ tone: 'warning', title, message, durationMs });
  }

  danger(title: string, message: string, durationMs?: number): string {
    return this.show({ tone: 'danger', title, message, durationMs });
  }

  dismiss(id: string): void {
    this.clearTimeout(id);
    this.alertsState.update(current => current.filter(alert => alert.id !== id));
  }

  clear(): void {
    for (const id of this.timeoutById.keys()) {
      this.clearTimeout(id);
    }
    this.alertsState.set([]);
  }

  private resolveDefaultDuration(tone: AppAlertTone): number {
    if (tone === 'danger') {
      return 7000;
    }
    if (tone === 'warning') {
      return 6000;
    }
    return 4200;
  }

  private clearTimeout(id: string): void {
    const timeout = this.timeoutById.get(id);
    if (!timeout) {
      return;
    }

    clearTimeout(timeout);
    this.timeoutById.delete(id);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `alert-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  }
}
