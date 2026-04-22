import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppLocale } from '../../../core/i18n/i18n.config';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { ThemePalette, ThemePaletteOption } from '../../stores/theme.store';
import { UiDropdownComponent } from '../../ui/dropdown/ui-dropdown';

@Component({
  selector: 'tiqui-navbar',
  imports: [CommonModule, RouterModule, UiDropdownComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly i18n = inject(I18nStore);

  companyLogo = input<string>('');
  companyName = input<string>('TiquiApp');
  pageTitle = input<string>('Fichajes');
  userName = input<string>('Usuario');
  sidebarCollapsed = input<boolean>(false);
  userMenuOpen = input<boolean>(false);
  darkMode = input<boolean>(false);
  activePalette = input<ThemePalette>('tiqui');
  paletteOptions = input<ThemePaletteOption[]>([]);

  logout = output<void>();
  toggleMobileSidebar = output<void>();
  toggleUserMenu = output<void>();
  closeUserMenu = output<void>();
  toggleDarkMode = output<void>();
  paletteChange = output<ThemePalette>();

  readonly language = computed(() => this.i18n.locale());
  readonly languageOptions = this.i18n.localeOptions;
  readonly commonTexts = computed(() => this.i18n.translations().common);
  readonly navbarTexts = computed(() => this.i18n.translations().navbar);

  userInitials = computed(() => {
    const value = this.userName().trim();
    if (!value) {
      return 'US';
    }

    const chunks = value.split(' ').filter(Boolean);
    if (chunks.length === 1) {
      return chunks[0].slice(0, 2).toUpperCase();
    }

    return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
  });

  onLogout(): void {
    this.logout.emit();
    this.closeUserMenu.emit();
  }

  closeMenu(): void {
    this.closeUserMenu.emit();
  }

  onToggleUserMenu(): void {
    this.toggleUserMenu.emit();
  }

  onToggleDarkMode(): void {
    this.toggleDarkMode.emit();
  }

  onPaletteChange(palette: ThemePalette): void {
    this.paletteChange.emit(palette);
  }

  onLocaleChange(locale: AppLocale): void {
    this.i18n.setLocale(locale);
  }
}
