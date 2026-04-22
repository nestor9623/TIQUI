import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserRole } from '../../../../core/auth/models/auth.model';
import { I18nStore } from '../../../../core/i18n/i18n.store';
import { AppAlertService } from '../../../../shared/services/app-alert.service';
import { UsersFacade } from '../../../../core/application/services/users.facade';
import { ProfileEntity } from '../../../../core/domain/entities/profile.entity';
import { TeamLeaderAssignmentsService } from '../../../../core/infraestructure/repositories/team-leader-assignments.service';

interface TeamLeaderItem {
  id: string;
  name: string;
  area: string;
  assigned: number;
}

interface EmployeeItem {
  id: string;
  name: string;
  area: string;
  assignedTeamLeaderId: string | null;
}

@Component({
  selector: 'app-team-leaders-assignments',
  templateUrl: './team-leaders-assignments.html',
  styleUrl: './team-leaders-assignments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamLeadersAssignmentsPage {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly alertService = inject(AppAlertService);
  private readonly usersFacade = inject(UsersFacade);
  private readonly assignmentsService = inject(TeamLeaderAssignmentsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly filters = signal('');
  readonly pendingRequests = signal<Record<string, 'assignment' | 'reassignment'>>({});
  private readonly scopedProfiles = signal<ProfileEntity[]>([]);
  private readonly assignmentByEmployee = signal<Record<string, string | null>>({});
  private readonly loadedScopeKey = signal<string | null>(null);
  readonly texts = computed(() => this.i18n.translations().teamLeaders);

  private readonly employeeProfiles = computed(() =>
    this.scopedProfiles().filter(profile => profile.role === UserRole.EMPLOYEE && profile.active),
  );
  private readonly memberProfiles = computed(() =>
    this.employeeProfiles().filter(profile => !profile.isTeamLeader),
  );

  readonly teamLeaders = computed<TeamLeaderItem[]>(() => {
    const members = this.memberProfiles();
    const assignments = this.assignmentByEmployee();

    return this.employeeProfiles()
      .filter(profile => profile.isTeamLeader)
      .map(profile => ({
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email,
        area: profile.area ?? this.texts().fallback.area,
        assigned: members.filter(member => assignments[member.id] === profile.id).length,
      }));
  });

  /** Role-based access: ADMIN and MANAGER can assign directly. */
  readonly currentUser = computed(() => this.authService.getCurrentUser());
  readonly canDirectManage = computed(() => {
    const role = this.currentUser()?.role;
    return role === UserRole.ADMIN || role === UserRole.MANAGER;
  });
  readonly canRequestAssignments = computed(() => {
    const user = this.currentUser();
    return user?.role === UserRole.EMPLOYEE && Boolean(user.isTeamLeader);
  });

  /**
   * If the current user is a Team Leader (EMPLOYEE + isTeamLeader),
   * pre-select their own TL entry so they only see their own team.
   */
  readonly myTlId = computed(() => {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.EMPLOYEE || !user.isTeamLeader) {
      return null;
    }

    const match = this.teamLeaders().find(tl => tl.id === user.id);
    return match?.id ?? null;
  });

  readonly selectedTeamLeaderId = signal<string | null>(null);
  readonly targetTeamLeaderId = computed(() => this.myTlId() ?? this.selectedTeamLeaderId());

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (!user) {
        return;
      }

      const scopeKey = `${user.id}:${user.role}:${user.managerId ?? ''}`;
      if (this.loadedScopeKey() === scopeKey) {
        return;
      }

      this.loadedScopeKey.set(scopeKey);
      this.loadRuntimeData();
    });
  }

  readonly visibleTeamLeaders = computed(() => {
    // TL employees only see themselves
    const myTl = this.myTlId();
    if (myTl) {
      return this.teamLeaders().filter(tl => tl.id === myTl);
    }

    const term = this.filters().trim().toLowerCase();
    if (!term) {
      return this.teamLeaders();
    }

    return this.teamLeaders().filter(item => `${item.name} ${item.area}`.toLowerCase().includes(term));
  });

  readonly availableEmployees = computed(() =>
    this.memberProfiles()
      .map(profile => {
        const assignedTeamLeaderId = this.assignmentByEmployee()[profile.id] ?? null;
        return {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email,
          area: profile.area ?? this.texts().fallback.area,
          assignedTeamLeaderId,
          isAssignedToSelected: assignedTeamLeaderId === this.targetTeamLeaderId(),
          needsReassignment: Boolean(assignedTeamLeaderId && assignedTeamLeaderId !== this.targetTeamLeaderId()),
          requestPending: Boolean(this.pendingRequests()[profile.id]),
        };
      }));

  private loadRuntimeData(): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.loading.set(true);
    forkJoin({
      profiles: this.resolveProfilesStream(user),
      assignments: this.assignmentsService.getActiveAssignments(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ profiles, assignments }) => {
          const scoped = profiles.filter(profile => profile.role === UserRole.EMPLOYEE && profile.active);
          this.scopedProfiles.set(scoped);

          const assignmentMap: Record<string, string | null> = {};
          for (const row of assignments) {
            assignmentMap[row.employee_id] = row.team_leader_id;
          }
          this.assignmentByEmployee.set(assignmentMap);

          const currentSelection = this.selectedTeamLeaderId();
          const exists = this.teamLeaders().some(tl => tl.id === currentSelection);
          if (!exists) {
            this.selectedTeamLeaderId.set(this.teamLeaders()[0]?.id ?? null);
          }

          this.loading.set(false);
        },
        error: (err: { message?: string }) => {
          this.loading.set(false);
          this.scopedProfiles.set([]);
          this.assignmentByEmployee.set({});
          this.alertService.warning(this.texts().alerts.loadErrorTitle, err?.message ?? this.texts().alerts.loadErrorMessage);
        },
      });
  }

  private resolveProfilesStream(user: NonNullable<ReturnType<AuthService['getCurrentUser']>>): Observable<ProfileEntity[]> {
    if (user.role === UserRole.ADMIN) {
      return this.usersFacade.getAll();
    }

    if (user.role === UserRole.MANAGER) {
      return this.usersFacade.getByManager(user.id);
    }

    if (user.role === UserRole.EMPLOYEE && user.isTeamLeader) {
      if (user.managerId) {
        return this.usersFacade.getByManager(user.managerId);
      }
      return of([]);
    }

    return of([]);
  }

  selectTeamLeader(id: string): void {
    if (!this.canDirectManage()) return;
    this.selectedTeamLeaderId.set(id);
  }

  updateFilter(event: Event): void {
    if (!this.canDirectManage()) return;
    const target = event.target as HTMLInputElement;
    this.filters.set(target.value);
  }

  assignEmployee(employeeId: string): void {
    if (!this.canDirectManage()) return;

    const reviewer = this.currentUser();
    const targetTeamLeaderId = this.targetTeamLeaderId();
    if (!reviewer || !targetTeamLeaderId) {
      this.alertService.warning(this.texts().alerts.missingTargetTitle, this.texts().alerts.missingTargetMessage);
      return;
    }

    this.assignmentsService.assignEmployee(employeeId, targetTeamLeaderId, reviewer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assignmentByEmployee.update(current => ({ ...current, [employeeId]: targetTeamLeaderId }));
          this.alertService.success(this.texts().alerts.assignmentUpdatedTitle, this.texts().alerts.assignmentUpdatedMessage);
        },
        error: (err: { message?: string }) => {
          this.alertService.warning(this.texts().alerts.assignmentSaveErrorTitle, err?.message ?? this.texts().alerts.assignmentSaveErrorMessage);
        },
      });
  }

  requestAssignment(employeeId: string): void {
    if (!this.canRequestAssignments()) return;

    const employee = this.availableEmployees().find(item => item.id === employeeId);
    if (!employee) return;

    const requestType = employee.assignedTeamLeaderId ? 'reassignment' : 'assignment';
    this.pendingRequests.update(current => ({
      ...current,
      [employeeId]: requestType,
    }));

    this.alertService.info(
      this.texts().alerts.requestSentTitle,
      requestType === 'assignment'
        ? this.texts().alerts.requestJoinMessage
        : this.texts().alerts.requestChangeMessage,
    );
  }

  formatAssignedLabel(count: number): string {
    return this.interpolate(this.texts().leaders.assignedLabel, { count });
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}
