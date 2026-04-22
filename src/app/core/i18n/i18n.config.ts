export type AppLocale = 'es' | 'en';

export interface LocaleOption {
  id: AppLocale;
  label: string;
  shortLabel: string;
}

// Secciones del bundle de traducciones. Los valores se cargan directamente
// desde assets/i18n/<locale>/<seccion>.json — sin interfaces ni objetos vacíos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TranslationBundle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  common: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navbar: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forgotPassword: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reports: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incidentApproval: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assistant: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alerts: any;
}

export const I18N_STORAGE_KEY = 'tiqui.locale';
export const DEFAULT_LOCALE: AppLocale = 'es';

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: 'es', label: 'Español', shortLabel: 'ES' },
  { id: 'en', label: 'English', shortLabel: 'EN' },
];
