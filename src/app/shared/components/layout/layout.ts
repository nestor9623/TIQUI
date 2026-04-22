import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NavigationService } from '../../../core/auth/services/navigation.service';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { EMPTY_ASSISTANT_SNAPSHOT, WorklogAssistantService } from '../../../core/application/services/worklog-assistant.service';
import { LayoutUiStore } from '../../stores/layout-ui.store';
import { ThemePalette, ThemeStore } from '../../stores/theme.store';
import { WorklogAssistantPanelComponent } from '../../ui/worklog-assistant-panel/worklog-assistant-panel';

@Component({
  selector: 'tiqui-layout',
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, WorklogAssistantPanelComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly layoutUiStore = inject(LayoutUiStore);
  private readonly themeStore = inject(ThemeStore);
  private readonly assistantService = inject(WorklogAssistantService);
  private readonly i18n = inject(I18nStore);

  private readonly authState = this.authService.auth;
  readonly assistantSnapshot = toSignal(this.assistantService.getSnapshot(), {
    initialValue: EMPTY_ASSISTANT_SNAPSHOT,
  });

  readonly sidebarCollapsed = computed(() => this.layoutUiStore.sidebarCollapsed());
  readonly sidebarOpen = computed(() => this.layoutUiStore.mobileSidebarOpen());
  readonly userMenuOpen = computed(() => this.layoutUiStore.userMenuOpen());
  readonly assistantPanelOpen = computed(() => this.layoutUiStore.assistantPanelOpen());
  readonly activePalette = computed(() => this.themeStore.palette());
  readonly darkMode = computed(() => this.themeStore.darkMode());
  readonly paletteOptions = this.themeStore.paletteOptions;
  readonly commonTexts = computed(() => this.i18n.translations().common);
  readonly assistantTexts = computed(() => this.i18n.translations().assistant);
  readonly assistantUnreadCount = computed(() => this.assistantSnapshot().unreadCount);
  readonly assistantUnreadCountLabel = computed(() => {
    const unreadCount = this.assistantUnreadCount();
    return unreadCount > 9 ? '9+' : String(unreadCount);
  });
  readonly assistantUnreadAriaLabel = computed(() => this.interpolate(this.assistantTexts().panel.accessibility.unreadCount, {
    count: this.assistantUnreadCount(),
  }));

  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly userName = computed(() => {
    const user = this.authState().user;
    if (!user) {
      return this.commonTexts().labels.userFallback;
    }

    return `${user.firstName} ${user.lastName}`.trim();
  });

  readonly sidebarSections = computed(() => {
    const user = this.authState().user;
    if (!user) {
      return [];
    }

    return this.navigationService.getNavigationByRole(user.role);
  });

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleMobileSidebar(): void {
    this.layoutUiStore.toggleMobileSidebar();
  }

  closeMobileSidebar(): void {
    this.layoutUiStore.closeMobileSidebar();
  }

  onSidebarCollapsedChange(value: boolean): void {
    this.layoutUiStore.setSidebarCollapsed(value);
  }

  toggleUserMenu(): void {
    this.layoutUiStore.toggleUserMenu();
  }

  closeUserMenu(): void {
    this.layoutUiStore.closeUserMenu();
  }

  toggleAssistantPanel(): void {
    this.layoutUiStore.toggleAssistantPanel();
  }

  closeAssistantPanel(): void {
    this.layoutUiStore.closeAssistantPanel();
  }

  toggleDarkMode(): void {
    this.themeStore.toggleDarkMode();
  }

  setPalette(palette: ThemePalette): void {
    this.themeStore.setPalette(palette);
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}

