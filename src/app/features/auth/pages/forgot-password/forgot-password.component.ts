import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { startWith, timer } from 'rxjs';
import { I18nStore } from '../../../../core/i18n/i18n.store';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nStore);

  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly formStatus = toSignal(
    this.forgotPasswordForm.statusChanges.pipe(startWith(this.forgotPasswordForm.status)),
    { initialValue: this.forgotPasswordForm.status },
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly forgotTexts = computed(() => this.i18n.translations().forgotPassword);

  readonly isEmailInvalid = computed(() => {
    this.formStatus();
    return Boolean(this.emailControl?.invalid && this.emailControl?.touched);
  });

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    timer(1600)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loading.set(false);
        this.success.set(true);

        timer(3000)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            void this.router.navigate(['/auth/login']);
          });
      });
  }

  goBack(): void {
    void this.router.navigate(['/auth/login']);
  }

  get emailControl() {
    return this.forgotPasswordForm.get('email');
  }
}
