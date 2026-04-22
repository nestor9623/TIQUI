import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../../core/auth/services/auth.service';
import { I18nStore } from '../../../../core/i18n/i18n.store';
import { AuthMockService } from '../../../../core/mock/auth-mock.service';
import { ThemePalette, ThemeStore } from '../../../../shared/stores/theme.store';
import { LoginComponent } from './login.component';

class AuthServiceStub {
  isAuthenticated(): boolean {
    return false;
  }

  login() {
    return of({});
  }
}

class AuthMockServiceStub {
  getDemoCredentials() {
    return [{ email: 'demo@tiqui.es', password: '123456', role: 'Admin' }];
  }
}

class I18nStoreStub {
  private readonly localeState = signal<'es' | 'en'>('es');

  readonly localeOptions = [
    { id: 'es' as const, label: 'Español', shortLabel: 'ES' },
    { id: 'en' as const, label: 'English', shortLabel: 'EN' },
  ];

  readonly locale = this.localeState.asReadonly();
  readonly translations = signal({
    common: {
      appName: 'TiquiApp',
      actions: { login: 'Iniciar sesión', logout: 'Cerrar sesión', menu: 'Menú' },
      language: { label: 'Idioma', spanish: 'Español', english: 'English' },
      theme: { label: 'Paleta', light: 'Modo claro', dark: 'Modo oscuro' },
    },
    login: {
      hero: {
        eyebrow: 'Smart workforce',
        subtitle: 'Gestiona todo desde un solo lugar',
        intro: 'Bienvenido',
        titleLead: 'Control',
        rotator: ['global', 'ágil', 'seguro'],
        mapTitle: 'Cobertura',
        mapCaption: 'Operativa internacional',
        storyKicker: 'Casos reales',
        storyTitle: 'Equipos conectados',
        storyBody: 'Todo listo para operar.',
        features: [{ title: 'Turnos', description: 'Planificación clara' }],
      },
      form: {
        panelKicker: 'Acceso',
        title: 'Entrar',
        subtitle: 'Introduce tus credenciales',
        emailLabel: 'Email',
        emailPlaceholder: 'correo@empresa.com',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: '••••••',
        forgotPassword: 'Olvidé la contraseña',
        submit: 'Iniciar sesión',
        submitting: 'Entrando...',
        demoTitle: 'Accesos demo',
        errors: {
          generic: 'Error',
          emailRequired: 'Requerido',
          emailInvalid: 'Inválido',
          passwordRequired: 'Requerido',
          passwordMin: 'Muy corta',
        },
      },
    },
    navbar: { userMenu: 'Menú de usuario' },
    forgotPassword: { title: 'Recuperar' },
    reports: { title: 'Reportes' },
  });

  setLocale(locale: 'es' | 'en'): void {
    this.localeState.set(locale);
  }
}

class ThemeStoreStub {
  private readonly paletteState = signal<ThemePalette>('tiqui');
  private readonly darkModeState = signal(false);

  readonly paletteOptions = [
    { id: 'tiqui' as const, label: 'Tiqui' },
    { id: 'emerald' as const, label: 'Emerald' },
    { id: 'sunset' as const, label: 'Sunset' },
  ];

  readonly palette = this.paletteState.asReadonly();
  readonly darkMode = this.darkModeState.asReadonly();

  setPalette(palette: ThemePalette): void {
    this.paletteState.set(palette);
  }

  setDarkMode(value: boolean): void {
    this.darkModeState.set(value);
  }

  toggleDarkMode(): void {
    this.darkModeState.update(current => !current);
  }
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let i18nStore: I18nStoreStub;
  let themeStore: ThemeStoreStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: AuthMockService, useClass: AuthMockServiceStub },
        { provide: I18nStore, useClass: I18nStoreStub },
        { provide: ThemeStore, useClass: ThemeStoreStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                lang: 'en',
                theme: 'emerald',
                dark: 'true',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    i18nStore = TestBed.inject(I18nStore) as unknown as I18nStoreStub;
    themeStore = TestBed.inject(ThemeStore) as unknown as ThemeStoreStub;
    fixture.detectChanges();
  });

  it('shows language and theme controls before login', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.login__locale-btn').length).toBe(2);
    expect(element.querySelectorAll('.login__palette-btn').length).toBe(3);
    expect(element.querySelector('.login__theme-toggle')).toBeTruthy();
  });

  it('applies preloaded preferences from query params on init', () => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(i18nStore.locale()).toBe('en');
    expect(themeStore.palette()).toBe('emerald');
    expect(themeStore.darkMode()).toBe(true);
  });
});
