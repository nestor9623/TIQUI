import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpLoadingService {
  private readonly pendingRequestsState = signal(0);

  readonly pendingRequests = this.pendingRequestsState.asReadonly();
  readonly loading = computed(() => this.pendingRequestsState() > 0);

  startRequest(): void {
    this.pendingRequestsState.update(value => value + 1);
  }

  endRequest(): void {
    this.pendingRequestsState.update(value => Math.max(0, value - 1));
  }
}
