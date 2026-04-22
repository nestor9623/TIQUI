import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { User, UserRole } from '../../auth/models/auth.model';
import { MOCK_PATHS } from '../mock-config';
import { MockJsonLoaderService } from './mock-json-loader.service';

const USERS_STORAGE_KEY = 'tiqui.mock.users.data';

export interface ManagedUserRecord extends User {
  password: string;
  address: string;
}

export type ManagedUserDraft = Omit<ManagedUserRecord, 'id'>;

@Injectable({ providedIn: 'root' })
export class MockUsersService {
  private readonly jsonLoader = inject(MockJsonLoaderService);
  private readonly usersState = signal<ManagedUserRecord[]>([]);
  private readonly loadedState = signal(false);

  readonly users = this.usersState.asReadonly();
  readonly managers = computed(() =>
    this.usersState().filter(user => user.role === UserRole.ADMIN || user.role === UserRole.MANAGER),
  );

  getUsers(): Observable<ManagedUserRecord[]> {
    if (this.loadedState()) {
      return of(this.usersState());
    }

    const storedUsers = this.readStoredUsers();
    if (storedUsers.length > 0) {
      this.usersState.set(storedUsers);
      this.loadedState.set(true);
      return of(this.usersState());
    }

    return this.jsonLoader.loadJson<ManagedUserRecord[]>(MOCK_PATHS.users).pipe(
      map(users => users.map(user => this.normalizeUser(user))),
      tap(users => {
        this.usersState.set(users);
        this.loadedState.set(true);
        this.persistUsers();
      }),
    );
  }

  createUser(draft: ManagedUserDraft): void {
    const nextUser = this.normalizeUser({ ...draft, id: this.getNextId() });
    this.usersState.update(users => [...users, nextUser]);
    this.loadedState.set(true);
    this.persistUsers();
  }

  updateUser(id: string, draft: Partial<ManagedUserDraft>): void {
    this.usersState.update(users =>
      users.map(user => (user.id === id ? this.normalizeUser({ ...user, ...draft, id }) : user)),
    );
    this.loadedState.set(true);
    this.persistUsers();
  }

  deleteUser(id: string): void {
    this.usersState.update(users => users.filter(user => user.id !== id));
    this.loadedState.set(true);
    this.persistUsers();
  }

  private persistUsers(): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.usersState()));
  }

  private readStoredUsers(): ManagedUserRecord[] {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map(user => this.normalizeUser(user));
    } catch {
      return [];
    }
  }

  private normalizeUser(user: Partial<ManagedUserRecord>): ManagedUserRecord {
    const role = this.normalizeRole(user.role);
    const community = this.normalizeCommunity(user.community);
    const area = String(user.area ?? 'Operaciones').trim() || 'Operaciones';
    const address = String(user.address ?? '').trim() || 'Sin dirección';
    const weeklyHoursTarget = Number(user.weeklyHoursTarget ?? 40);

    return {
      id: String(user.id ?? this.getNextId()),
      email: String(user.email ?? '').trim().toLowerCase(),
      password: String(user.password ?? '').trim(),
      firstName: String(user.firstName ?? '').trim(),
      lastName: String(user.lastName ?? '').trim(),
      role,
      active: Boolean(user.active ?? true),
      address,
      area,
      community,
      weeklyHoursTarget: Number.isFinite(weeklyHoursTarget) ? weeklyHoursTarget : 40,
      managerId: role === UserRole.EMPLOYEE ? (user.managerId ? String(user.managerId) : null) : null,
      vacationDates: Array.isArray(user.vacationDates) ? user.vacationDates : [],
      avatar: user.avatar,
    };
  }

  private normalizeRole(role: unknown): UserRole {
    const value = String(role ?? UserRole.EMPLOYEE).toLowerCase();
    if (value === UserRole.ADMIN) {
      return UserRole.ADMIN;
    }
    if (value === UserRole.MANAGER) {
      return UserRole.MANAGER;
    }
    return UserRole.EMPLOYEE;
  }

  private normalizeCommunity(value: unknown): 'madrid' | 'galicia' {
    return String(value ?? 'madrid').toLowerCase() === 'galicia' ? 'galicia' : 'madrid';
  }

  private getNextId(): string {
    const maxId = this.usersState().reduce((currentMax, user) => Math.max(currentMax, Number(user.id) || 0), 0);
    return String(maxId + 1);
  }
}
