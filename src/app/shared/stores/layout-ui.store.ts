import { Injectable, signal } from '@angular/core';

const SIDEBAR_COLLAPSED_KEY = 'tiqui.sidebar.collapsed';
const ASSISTANT_PANEL_OPEN_KEY = 'tiqui.assistant.panel.open';

@Injectable({
  providedIn: 'root',
})
export class LayoutUiStore {
  private readonly sidebarCollapsedState = signal(this.readBoolean(SIDEBAR_COLLAPSED_KEY, false));
  private readonly mobileSidebarOpenState = signal(false);
  private readonly userMenuOpenState = signal(false);
  private readonly assistantPanelOpenState = signal(this.readBoolean(ASSISTANT_PANEL_OPEN_KEY, false));

  readonly sidebarCollapsed = this.sidebarCollapsedState.asReadonly();
  readonly mobileSidebarOpen = this.mobileSidebarOpenState.asReadonly();
  readonly userMenuOpen = this.userMenuOpenState.asReadonly();
  readonly assistantPanelOpen = this.assistantPanelOpenState.asReadonly();

  setSidebarCollapsed(value: boolean): void {
    this.sidebarCollapsedState.set(value);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  }

  toggleSidebarCollapsed(): void {
    this.setSidebarCollapsed(!this.sidebarCollapsedState());
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpenState.update(value => !value);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpenState.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpenState.update(value => !value);
  }

  closeUserMenu(): void {
    this.userMenuOpenState.set(false);
  }

  toggleAssistantPanel(): void {
    const nextValue = !this.assistantPanelOpenState();
    this.assistantPanelOpenState.set(nextValue);
    localStorage.setItem(ASSISTANT_PANEL_OPEN_KEY, String(nextValue));
  }

  closeAssistantPanel(): void {
    this.assistantPanelOpenState.set(false);
    localStorage.setItem(ASSISTANT_PANEL_OPEN_KEY, 'false');
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return raw === 'true';
  }
}
