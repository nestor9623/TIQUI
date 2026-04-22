import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { ManagedUserDraft, ManagedUserRecord, MockUsersService } from '../../../core/mock/services/mock-users.service';
import { AppAlertService } from '../../../shared/services/app-alert.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button';
import { UiConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/ui-confirm-dialog';
import { UiIconComponent } from '../../../shared/ui/icon/ui-icon';

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | 'active' | 'inactive';

interface PendingConfirmation {
  type: 'toggle' | 'delete';
  user: ManagedUserRecord;
  nextActive?: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'primary' | 'danger';
}

@Component({
  selector: 'app-users-management',
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiIconComponent, TooltipDirective, UiConfirmDialogComponent],
  templateUrl: './users-management.html',
  styleUrl: './users-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersManagement {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly usersService = inject(MockUsersService);
  private readonly appAlertService = inject(AppAlertService);
  private readonly document = inject(DOCUMENT);

  readonly searchTerm = signal('');
  readonly selectedRole = signal<RoleFilter>('all');
  readonly selectedStatus = signal<StatusFilter>('all');
  readonly editingUserId = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly feedbackMessage = signal('');
  readonly pendingConfirmation = signal<PendingConfirmation | null>(null);
  readonly translations = computed(() => this.i18n.translations().users);

  readonly roleOptions = computed(() => {
    const texts = this.translations().roles;
    return [
      { id: UserRole.ADMIN, label: texts.admin },
      { id: UserRole.MANAGER, label: texts.manager },
      { id: UserRole.EMPLOYEE, label: texts.employee },
    ];
  });

  readonly communityOptions = computed(() => {
    const texts = this.translations().communities;
    return [
      { id: 'madrid' as const, label: texts.madrid },
      { id: 'galicia' as const, label: texts.galicia },
    ];
  });

  readonly users = toSignal(this.usersService.getUsers(), { initialValue: [] as ManagedUserRecord[] });
  readonly isEditing = computed(() => this.editingUserId() !== null);
  readonly modalTitle = computed(() => this.isEditing() ? this.translations().modal.editTitle : this.translations().modal.createTitle);
  readonly confirmOpen = computed(() => this.pendingConfirmation() !== null);
  readonly confirmTitle = computed(() => this.pendingConfirmation()?.title ?? this.translations().confirm.defaultTitle);
  readonly confirmMessage = computed(() => this.pendingConfirmation()?.message ?? this.translations().confirm.defaultMessage);
  readonly confirmLabel = computed(() => this.pendingConfirmation()?.confirmLabel ?? this.translations().confirm.defaultLabel);
  readonly confirmTone = computed<'primary' | 'danger'>(() => this.pendingConfirmation()?.tone ?? 'primary');
  readonly totalUsers = computed(() => this.users().length);
  readonly activeUsers = computed(() => this.users().filter(user => user.active).length);
  readonly inactiveUsers = computed(() => this.users().filter(user => !user.active).length);
  readonly adminUsers = computed(() => this.users().filter(user => user.role === UserRole.ADMIN).length);
  readonly managerOptions = computed(() =>
    this.users().filter(user => user.role === UserRole.ADMIN || user.role === UserRole.MANAGER),
  );

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.selectedRole();
    const status = this.selectedStatus();

    return this.users().filter(user => {
      const matchesTerm = !term || [
        user.firstName,
        user.lastName,
        user.email,
        user.area,
        user.address,
      ].some(value => String(value ?? '').toLowerCase().includes(term));

      const matchesRole = role === 'all' || user.role === role;
      const matchesStatus = status === 'all' || (status === 'active' ? user.active : !user.active);

      return matchesTerm && matchesRole && matchesStatus;
    });
  });

  readonly userForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: [UserRole.EMPLOYEE, [Validators.required]],
    address: ['', [Validators.required]],
    area: ['', [Validators.required]],
    community: ['madrid' as 'madrid' | 'galicia', [Validators.required]],
    weeklyHoursTarget: [40, [Validators.required, Validators.min(10), Validators.max(60)]],
    managerId: [''],
    active: [true],
  });

  updateSearchTerm(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  updateRoleFilter(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedRole.set(value === 'all' ? 'all' : this.normalizeRole(value));
  }

  updateStatusFilter(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedStatus.set(value === 'inactive' ? 'inactive' : value === 'active' ? 'active' : 'all');
  }

  openCreateModal(): void {
    this.resetForm();
    this.feedbackMessage.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.resetForm();
  }

  submitUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    if (this.isEditing() && this.editingUserId() === this.authService.getCurrentUser()?.id && !this.userForm.getRawValue().active) {
      const message = this.translations().feedback.selfDeactivateBlocked;
      this.feedbackMessage.set(message);
      this.appAlertService.warning(this.i18n.translations().alerts.users.actionNotAllowedTitle, message);
      return;
    }

    const value = this.userForm.getRawValue();
    const payload: ManagedUserDraft = {
      email: value.email,
      password: value.password,
      firstName: value.firstName,
      lastName: value.lastName,
      role: value.role,
      active: value.active,
      address: value.address,
      area: value.area,
      community: value.community,
      weeklyHoursTarget: Number(value.weeklyHoursTarget),
      managerId: value.role === UserRole.EMPLOYEE ? (value.managerId || null) : null,
      vacationDates: [],
    };

    if (this.isEditing() && this.editingUserId()) {
      this.usersService.updateUser(this.editingUserId()!, payload);
      this.feedbackMessage.set(this.translations().feedback.userUpdated);
    } else {
      this.usersService.createUser(payload);
      this.feedbackMessage.set(this.translations().feedback.userCreated);
    }

    this.modalOpen.set(false);
    this.resetForm();
  }

  editUser(user: ManagedUserRecord): void {
    this.editingUserId.set(user.id);
    this.userForm.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      role: user.role,
      address: user.address,
      area: user.area ?? '',
      community: user.community ?? 'madrid',
      weeklyHoursTarget: user.weeklyHoursTarget ?? 40,
      managerId: user.managerId ?? '',
      active: user.active,
    });
    this.modalOpen.set(true);
    this.feedbackMessage.set(this.interpolate(this.translations().feedback.editUser, { name: `${user.firstName} ${user.lastName}` }));
  }

  requestToggleUserStatus(user: ManagedUserRecord): void {
    if (user.id === this.authService.getCurrentUser()?.id) {
      const message = this.translations().feedback.selfDeactivateBlocked;
      this.feedbackMessage.set(message);
      this.appAlertService.warning(this.i18n.translations().alerts.users.actionNotAllowedTitle, message);
      return;
    }

    const name = `${user.firstName} ${user.lastName}`;
    const confirmTexts = this.translations().confirm;

    this.pendingConfirmation.set({
      type: 'toggle',
      user,
      nextActive: !user.active,
      title: user.active ? confirmTexts.deactivateTitle : confirmTexts.activateTitle,
      message: user.active
        ? this.interpolate(confirmTexts.deactivateMessage, { name })
        : this.interpolate(confirmTexts.activateMessage, { name }),
      confirmLabel: user.active ? confirmTexts.deactivateLabel : confirmTexts.activateLabel,
      tone: user.active ? 'danger' : 'primary',
    });
  }

  requestDeleteUser(user: ManagedUserRecord): void {
    if (user.id === this.authService.getCurrentUser()?.id) {
      this.feedbackMessage.set(this.translations().feedback.selfDeleteBlocked);
      return;
    }

    this.pendingConfirmation.set({
      type: 'delete',
      user,
      title: this.translations().confirm.deleteTitle,
      message: this.interpolate(this.translations().confirm.deleteMessage, { name: `${user.firstName} ${user.lastName}` }),
      confirmLabel: this.translations().confirm.deleteLabel,
      tone: 'danger',
    });
  }

  confirmPendingAction(): void {
    const pending = this.pendingConfirmation();
    if (!pending) {
      return;
    }

    if (pending.type === 'toggle') {
      this.usersService.updateUser(pending.user.id, { active: pending.nextActive });
      this.feedbackMessage.set(pending.nextActive ? this.translations().feedback.userActivated : this.translations().feedback.userDeactivated);
    }

    if (pending.type === 'delete') {
      this.usersService.deleteUser(pending.user.id);
      if (this.editingUserId() === pending.user.id) {
        this.resetForm();
        this.modalOpen.set(false);
      }
      this.feedbackMessage.set(this.translations().feedback.userDeleted);
    }

    this.pendingConfirmation.set(null);
  }

  closeConfirmDialog(): void {
    this.pendingConfirmation.set(null);
  }

  cancelEdit(): void {
    this.closeModal();
    this.feedbackMessage.set(this.translations().feedback.editCancelled);
  }

  roleLabel(role: UserRole): string {
    const texts = this.translations().roles;
    switch (role) {
      case UserRole.ADMIN:
        return texts.admin;
      case UserRole.MANAGER:
        return texts.manager;
      default:
        return texts.employee;
    }
  }

  managerName(managerId: string | null | undefined): string {
    if (!managerId) {
      return this.translations().page.table.noManager;
    }

    const manager = this.users().find(user => user.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : this.translations().page.table.noManager;
  }

  private normalizeRole(value: string): UserRole {
    if (value === UserRole.ADMIN) {
      return UserRole.ADMIN;
    }
    if (value === UserRole.MANAGER) {
      return UserRole.MANAGER;
    }
    return UserRole.EMPLOYEE;
  }

  private resetForm(): void {
    this.editingUserId.set(null);
    this.userForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: UserRole.EMPLOYEE,
      address: '',
      area: '',
      community: 'madrid',
      weeklyHoursTarget: 40,
      managerId: '',
      active: true,
    });
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}
