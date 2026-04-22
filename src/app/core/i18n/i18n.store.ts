import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import {
  AppLocale,
  CommonTranslations,
  createEmptyTranslationBundle,
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  LOCALE_OPTIONS,
  LoginTranslations,
  NavbarTranslations,
  ForgotPasswordTranslations,
  ReportsTranslations,
  IncidentApprovalTranslations,
  AssistantTranslations,
  UsersTranslations,
  AlertsTranslations,
  TranslationBundle,
} from './i18n.config';

@Injectable({ providedIn: 'root' })
export class I18nStore {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly localeState = signal<AppLocale>(this.readLocale());
  private readonly translationsState = signal<TranslationBundle>(createEmptyTranslationBundle());

  readonly localeOptions = LOCALE_OPTIONS;
  readonly locale = this.localeState.asReadonly();
  readonly translations = this.translationsState.asReadonly();

  constructor() {
    effect(() => {
      const locale = this.localeState();
      localStorage.setItem(I18N_STORAGE_KEY, locale);
      this.document.documentElement.lang = locale;
    });
  }

  async init(): Promise<void> {
    await this.loadTranslations(this.localeState());
  }

  setLocale(locale: AppLocale): void {
    if (locale === this.localeState()) {
      return;
    }

    this.localeState.set(locale);
    void this.loadTranslations(locale);
  }

  t(path: string): string {
    const result = path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, this.translationsState());

    return typeof result === 'string' ? result : path;
  }

  private async loadTranslations(locale: AppLocale): Promise<void> {
    const bundle = await firstValueFrom(
      this.fetchBundle(locale).pipe(
        catchError(error => {
          console.error('Error loading translations for locale', locale, error);

          if (locale !== DEFAULT_LOCALE) {
            this.localeState.set(DEFAULT_LOCALE);
            return this.fetchBundle(DEFAULT_LOCALE);
          }

          return of(createEmptyTranslationBundle());
        }),
      ),
    );

    this.translationsState.set(bundle);
  }

  private fetchBundle(locale: AppLocale) {
    const basePath = `assets/i18n/${locale}`;

    return forkJoin({
      common: this.http.get<CommonTranslations>(`${basePath}/common.json`),
      login: this.http.get<LoginTranslations>(`${basePath}/login.json`),
      navbar: this.http.get<NavbarTranslations>(`${basePath}/navbar.json`),
      forgotPassword: this.http.get<ForgotPasswordTranslations>(`${basePath}/forgot-password.json`),
      reports: this.http.get<ReportsTranslations>(`${basePath}/reports.json`),
      incidentApproval: this.http.get<IncidentApprovalTranslations>(`${basePath}/incident-approval.json`),
      assistant: this.http.get<AssistantTranslations>(`${basePath}/assistant.json`),
      users: this.http.get<UsersTranslations>(`${basePath}/users.json`),
      alerts: this.http.get<AlertsTranslations>(`${basePath}/alerts.json`),
    });
  }

  private readLocale(): AppLocale {
    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    return stored === 'en' || stored === 'es' ? stored : DEFAULT_LOCALE;
  }
}
