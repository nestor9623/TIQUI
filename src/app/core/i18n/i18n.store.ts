import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import {
  AppLocale,
  TranslationBundle,
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  LOCALE_OPTIONS,
} from './i18n.config';

const EMPTY_BUNDLE: TranslationBundle = {} as TranslationBundle;

const BUNDLE_KEYS: Record<string, string> = {
  common: 'common.json',
  login: 'login.json',
  navbar: 'navbar.json',
  forgotPassword: 'forgot-password.json',
  reports: 'reports.json',
  incidentApproval: 'incident-approval.json',
  assistant: 'assistant.json',
  users: 'users.json',
  alerts: 'alerts.json',
  teamLeaders: 'team-leaders.json',
  fichajes: 'fichajes.json',
  adminDashboard: 'admin-dashboard.json',
};

@Injectable({ providedIn: 'root' })
export class I18nStore {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly localeState = signal<AppLocale>(this.readLocale());
  private readonly translationsState = signal<TranslationBundle>(EMPTY_BUNDLE);

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

          return of(EMPTY_BUNDLE);
        }),
      ),
    );

    this.translationsState.set(bundle);
  }

  private fetchBundle(locale: AppLocale): Observable<TranslationBundle> {
    const basePath = `assets/i18n/${locale}`;
    const requests = Object.fromEntries(
      Object.entries(BUNDLE_KEYS).map(([key, file]) => [
        key,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.http.get<any>(`${basePath}/${file}`),
      ]),
    );
    return forkJoin(requests) as Observable<TranslationBundle>;
  }

  private readLocale(): AppLocale {
    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    return stored === 'en' || stored === 'es' ? stored : DEFAULT_LOCALE;
  }
}
