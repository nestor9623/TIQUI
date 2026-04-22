import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { UsersFacade } from '../../../core/application/services/users.facade';
import { ProfileEntity } from '../../../core/domain/entities/profile.entity';
import { AppAlertService } from '../../../shared/services/app-alert.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button';
import { UiConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/ui-confirm-dialog';
import { UiIconComponent } from '../../../shared/ui/icon/ui-icon';

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | 'active' | 'inactive';

interface PendingConfirmation {
  type: 'toggle' | 'delete' | 'teamLeader';
  user: ProfileEntity;
  nextActive?: boolean;
  nextTeamLeader?: boolean;
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
  private readonly usersFacade = inject(UsersFacade);
  private readonly appAlertService = inject(AppAlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly searchTerm = signal('');
  readonly selectedRole = signal<RoleFilter>('all');
  readonly selectedStatus = signal<StatusFilter>('all');
  readonly editingUserId = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly pendingConfirmation = signal<PendingConfirmation | null>(null);
  readonly translations = computed(() => this.i18n.translations().users);

  private readonly usersState = signal<ProfileEntity[]>([]);
  readonly users = this.usersState.asReadonly();

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
    role: [UserRole.EMPLOYEE, [Validators.required]],
    address: ['', [Validators.required]],
    area: ['', [Validators.required]],
    community: ['madrid' as 'madrid' | 'galicia', [Validators.required]],
    weeklyHoursTarget: [40, [Validators.required, Validators.min(10), Validators.max(60)]],
    managerId: [''],
    active: [true],
  });

  constructor() {
    this.loadUsers();
  }

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
      this.appAlertService.warning(this.i18n.translations().alerts.users.actionNotAllowedTitle, message);
      return;
    }

    const value = this.userForm.getRawValue();

    if (this.isEditing() && this.editingUserId()) {
      const patch: Partial<ProfileEntity> = {
        firstName: value.firstName,
        lastName: value.lastName,
        role: value.role,
        active: value.active,
        address: value.address,
        area: value.area,
        community: value.community,
        weeklyHoursTarget: Number(value.weeklyHoursTarget),
        managerId: value.role === UserRole.EMPLOYEE ? (value.managerId || null) : null,
      };
      this.usersFacade.update(this.editingUserId()!, patch)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: updated => {
            this.usersState.update(list => list.map(u => u.id === updated.id ? updated : u));
            this.appAlertService.success(
              this.i18n.translations().alerts.users.actionNotAllowedTitle ?? 'Actualizado',
              this.translations().feedback.userUpdated,
            );
          },
          error: () => this.appAlertService.warning('Error', 'No se pudo actualizar el usuario.'),
        });
    } else {
      // User creation requires Supabase Admin API (service role) – not available from the browser.
      this.appAlertService.warning('No disponible', 'La creación de usuarios requiere acceso de administrador al servidor.');
      this.modalOpen.set(false);
      this.resetForm();
      return;
    }

    this.modalOpen.set(false);
    this.resetForm();
  }

  editUser(user: ProfileEntity): void {
    this.editingUserId.set(user.id);
    this.userForm.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      address: user.address ?? '',
      area: user.area ?? '',
      community: user.community ?? 'madrid',
      weeklyHoursTarget: user.weeklyHoursTarget ?? 40,
      managerId: user.managerId ?? '',
      active: user.active,
    });
    this.modalOpen.set(true);
  }

  requestToggleUserStatus(user: ProfileEntity): void {
    if (user.id === this.authService.getCurrentUser()?.id) {
      const message = this.translations().feedback.selfDeactivateBlocked;
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

  requestToggleTeamLeader(user: ProfileEntity): void {
    if (user.role !== UserRole.EMPLOYEE) return;

    const name = `${user.firstName} ${user.lastName}`;
    const promote = !user.isTeamLeader;
    const confirmTexts = this.translations().confirm;

    this.pendingConfirmation.set({
      type: 'teamLeader',
      user,
      nextTeamLeader: promote,
      title: promote ? confirmTexts.promoteTeamLeaderTitle : confirmTexts.demoteTeamLeaderTitle,
      message: promote
        ? this.interpolate(confirmTexts.promoteTeamLeaderMessage, { name })
        : this.interpolate(confirmTexts.demoteTeamLeaderMessage, { name }),
      confirmLabel: promote ? confirmTexts.promoteTeamLeaderLabel : confirmTexts.demoteTeamLeaderLabel,
      tone: promote ? 'primary' : 'danger',
    });
  }

  requestDeleteUser(user: ProfileEntity): void {
    if (user.id === this.authService.getCurrentUser()?.id) {
      this.appAlertService.warning(
        this.i18n.translations().alerts.users.actionNotAllowedTitle,
        this.translations().feedback.selfDeleteBlocked,
      );
      return;
    }
    // Delete requires service role – show info
    this.appAlertService.warning('No disponible', 'La eliminación de usuarios requiere acceso de administrador al servidor.');
  }

  confirmPendingAction(): void {
    const pending = this.pendingConfirmation();
    if (!pending) {
      return;
    }

    if (pending.type === 'toggle') {
      this.usersFacade.update(pending.user.id, { active: pending.nextActive })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: updated => {
            this.usersState.update(list => list.map(u => u.id === updated.id ? updated : u));
            const msg = pending.nextActive
              ? this.translations().feedback.userActivated
              : this.translations().feedback.userDeactivated;
            this.appAlertService.success('Estado actualizado', msg);
          },
          error: () => this.appAlertService.warning('Error', 'No se pudo cambiar el estado del usuario.'),
        });
    }

    if (pending.type === 'teamLeader') {
      this.usersFacade.update(pending.user.id, { isTeamLeader: pending.nextTeamLeader })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: updated => {
            this.usersState.update(list => list.map(u => u.id === updated.id ? updated : u));
            const msg = pending.nextTeamLeader
              ? this.translations().confirm.teamLeaderEnabledFeedback
              : this.translations().confirm.teamLeaderDisabledFeedback;
            this.appAlertService.success('Rol actualizado', msg);
          },
          error: () => this.appAlertService.warning('Error', 'No se pudo cambiar el rol de Team Leader.'),
        });
    }

    this.pendingConfirmation.set(null);
  }

  closeConfirmDialog(): void {
    this.pendingConfirmation.set(null);
  }

  cancelEdit(): void {
    this.closeModal();
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

  private loadUsers(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const load$ = currentUser.role === UserRole.ADMIN
      ? this.usersFacade.getAll()
      : this.usersFacade.getByManager(currentUser.id);

    load$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: users => this.usersState.set(users),
      error: () => this.usersState.set([]),
    });
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
