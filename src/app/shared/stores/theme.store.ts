import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

const THEME_PALETTE_KEY = 'tiqui.theme.palette';
const THEME_DARK_KEY = 'tiqui.theme.dark';

export type ThemePalette = 'tiqui' | 'emerald' | 'sunset';

export interface ThemePaletteOption {
  id: ThemePalette;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeStore {
  private readonly document = inject(DOCUMENT);

  readonly paletteOptions: ThemePaletteOption[] = [
    { id: 'tiqui', label: 'Tiqui' },
    { id: 'emerald', label: 'Emerald' },
    { id: 'sunset', label: 'Sunset' },
  ];

  private readonly paletteState = signal<ThemePalette>(this.readPalette());
  private readonly darkModeState = signal(this.readBoolean(THEME_DARK_KEY, false));

  readonly palette = this.paletteState.asReadonly();
  readonly darkMode = this.darkModeState.asReadonly();
  readonly currentThemeClass = computed(() => `theme-${this.paletteState()}`);

  constructor() {
    this.applyTheme();
  }

  setPalette(palette: ThemePalette): void {
    this.paletteState.set(palette);
    localStorage.setItem(THEME_PALETTE_KEY, palette);
    this.applyTheme();
  }

  setDarkMode(value: boolean): void {
    this.darkModeState.set(value);
    localStorage.setItem(THEME_DARK_KEY, String(value));
    this.applyTheme();
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.darkModeState());
  }

  private applyTheme(): void {
    const root = this.document.documentElement;
    root.classList.remove('theme-tiqui', 'theme-emerald', 'theme-sunset');
    root.classList.add(this.currentThemeClass());
    root.classList.toggle('dark-mode', this.darkModeState());
  }

  private readPalette(): ThemePalette {
    const raw = localStorage.getItem(THEME_PALETTE_KEY);
    if (raw === 'tiqui' || raw === 'emerald' || raw === 'sunset') {
      return raw;
    }
    return 'tiqui';
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return raw === 'true';
  }
}
