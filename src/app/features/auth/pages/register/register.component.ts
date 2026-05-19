import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AppAlertService } from '../../../../shared/services/app-alert.service';
import { AsyncButtonState } from '../../../../shared/utils/async-button-state';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly appAlertService = inject(AppAlertService);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  private readonly formStatus = toSignal(
    this.registerForm.statusChanges.pipe(startWith(this.registerForm.status)),
    { initialValue: this.registerForm.status },
  );

  readonly submit = new AsyncButtonState();
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly confirmationSent = signal(false);
  readonly registeredEmail = signal('');

  readonly isFirstNameInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.firstNameControl?.invalid && this.firstNameControl?.touched);
  });

  readonly isLastNameInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.lastNameControl?.invalid && this.lastNameControl?.touched);
  });

  readonly isEmailInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.emailControl?.invalid && this.emailControl?.touched);
  });

  readonly isPasswordInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.passwordControl?.invalid && this.passwordControl?.touched);
  });

  readonly passwordsDoNotMatch = computed(() => {
    this.formStatus();
    const password = this.passwordControl?.value ?? '';
    const confirmation = this.confirmPasswordControl?.value ?? '';
    const touched = this.confirmPasswordControl?.touched ?? false;
    return touched && password.length > 0 && confirmation.length > 0 && password !== confirmation;
  });

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordsDoNotMatch()) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    if (this.submit.disabled()) {
      return;
    }

    const value = this.registerForm.getRawValue();

    this.submit.start();
    this.authService.register({
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      password: value.password,
    }).subscribe({
      next: response => {
        this.submit.success();
        this.confirmationSent.set(true);
        this.registeredEmail.set(response.email);
        this.registerForm.disable();
      },
      error: (error: { message?: string } | null) => {
        this.submit.error();
        this.appAlertService.danger(
          'No se pudo registrar la cuenta',
          error?.message ?? 'Revisa los datos e intenta de nuevo.',
        );
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/auth/login'], { queryParams: { registered: '1' } });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(value => !value);
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

  get firstNameControl() {
    return this.registerForm.get('firstName');
  }

  get lastNameControl() {
    return this.registerForm.get('lastName');
  }

  get emailControl() {
    return this.registerForm.get('email');
  }

  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }
}
