import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { startWith } from 'rxjs';
import { AppLocale } from '../../../../core/i18n/i18n.config';
import { I18nStore } from '../../../../core/i18n/i18n.store';
import { AuthResponse, UserRole } from '../../../../core/auth/models/auth.model';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AppAlertService } from '../../../../shared/services/app-alert.service';
import { ThemePalette, ThemeStore } from '../../../../shared/stores/theme.store';
import { AsyncButtonState } from '../../../../shared/utils/async-button-state';
import { WorldCoverageMapComponent } from '../../components/world-coverage-map/world-coverage-map.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, WorldCoverageMapComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly appAlertService = inject(AppAlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nStore);
  private readonly themeStore = inject(ThemeStore);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  private readonly formStatus = toSignal(
    this.loginForm.statusChanges.pipe(startWith(this.loginForm.status)),
    { initialValue: this.loginForm.status },
  );

  readonly submit = new AsyncButtonState();
  readonly showPassword = signal(false);
  readonly returnUrl = signal<string | null>(null);
  readonly demoCredentials = signal([
    { email: 'admin@tiqui.com', password: 'Admin123!', role: 'Admin' },
    { email: 'manager@tiqui.com', password: 'Manager123!', role: 'Manager' },
    { email: 'employee@tiqui.com', password: 'Employee123!', role: 'Employee' },
  ]);
  readonly loginTexts = computed(() => this.i18n.translations().login);
  readonly commonTexts = computed(() => this.i18n.translations().common);
  readonly language = computed(() => this.i18n.locale());
  readonly languageOptions = this.i18n.localeOptions;
  readonly darkMode = computed(() => this.themeStore.darkMode());
  readonly activePalette = computed(() => this.themeStore.palette());
  readonly paletteOptions = this.themeStore.paletteOptions;

  readonly isEmailInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.emailControl?.invalid && this.emailControl?.touched);
  });

  readonly isPasswordInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.passwordControl?.invalid && this.passwordControl?.touched);
  });

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;

    this.applyPreloadedPreferences(queryParams);
    this.returnUrl.set(queryParams['returnUrl'] ?? null);

    if (this.authService.isAuthenticated()) {
      const currentRole = this.authService.getCurrentUser()?.role ?? UserRole.EMPLOYEE;
      void this.router.navigate([this.getDefaultRoute(currentRole)]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    if (this.submit.disabled()) return;

    this.submit.start();

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: (response: AuthResponse) => {
        this.submit.success();
        const fallbackRoute = this.getDefaultRoute(response.user.role);
        void this.router.navigate([this.returnUrl() || fallbackRoute]);
      },
      error: (error: { message?: string } | null) => {
        this.submit.error();
        this.appAlertService.danger(
          this.loginTexts().form.errors.authFailed ?? 'Error de acceso',
          error?.message || this.loginTexts().form.errors.generic,
        );
      },
    });
  }

  onMicrosoftLogin(): void {
    if (this.submit.disabled()) {
      return;
    }

    this.submit.start();

    this.authService.loginWithMicrosoft(this.returnUrl() || undefined).subscribe({
      next: () => this.submit.reset(),
      error: (error: { message?: string } | null) => {
        this.submit.error();
        this.appAlertService.warning(
          this.loginTexts().form.microsoft?.errors?.title ?? 'Microsoft 365',
          error?.message || this.loginTexts().form.microsoft?.errors?.generic || this.loginTexts().form.errors.generic,
        );
      },
    });
  }

  useDemoCredentials(email: string, password: string): void {
    this.submit.reset();
    this.loginForm.setValue({ email, password });
    this.onSubmit();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  onLocaleChange(locale: AppLocale): void {
    this.i18n.setLocale(locale);
  }

  onPaletteChange(palette: ThemePalette): void {
    this.themeStore.setPalette(palette);
  }

  onToggleDarkMode(): void {
    this.themeStore.toggleDarkMode();
  }

  private getDefaultRoute(role: UserRole): string {
    return role === UserRole.ADMIN || role === UserRole.MANAGER ? '/admin-dashboard' : '/home';
  }

  private applyPreloadedPreferences(queryParams: Record<string, unknown>): void {
    const locale = queryParams['lang'] ?? queryParams['locale'];
    if (locale === 'es' || locale === 'en') {
      this.i18n.setLocale(locale);
    }

    const theme = String(queryParams['theme'] ?? queryParams['palette'] ?? '').trim().toLowerCase();
    if (theme === 'dark' || theme === 'light') {
      this.themeStore.setDarkMode(theme === 'dark');
    } else if (theme === 'tiqui' || theme === 'emerald' || theme === 'sunset') {
      this.themeStore.setPalette(theme);
    }

    const darkMode = queryParams['dark'] ?? queryParams['darkMode'];
    if (darkMode !== undefined) {
      this.themeStore.setDarkMode(this.parseBooleanParam(darkMode));
    }
  }

  private parseBooleanParam(value: unknown): boolean {
    const normalized = String(value).trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
