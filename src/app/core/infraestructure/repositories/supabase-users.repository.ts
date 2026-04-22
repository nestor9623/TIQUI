import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../../auth/models/auth.model';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export interface ManagedUserRecord extends User {
  password?: string;
  address: string;
}

export type ManagedUserDraft = Omit<ManagedUserRecord, 'id'> & { password?: string };

@Injectable({ providedIn: 'root' })
export class SupabaseUsersRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  getUsers(): Observable<ManagedUserRecord[]> {
    return from(this.supabase.from('profiles').select('*').order('first_name')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(p => this.mapToRecord(p));
      }),
    );
  }

  getManagers(): Observable<ManagedUserRecord[]> {
    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'manager'])
        .order('first_name'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(p => this.mapToRecord(p));
      }),
    );
  }

  getUserById(id: string): Observable<ManagedUserRecord | null> {
    return from(this.supabase.from('profiles').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) return null;
        return data ? this.mapToRecord(data) : null;
      }),
    );
  }

  createUser(draft: ManagedUserDraft): Observable<ManagedUserRecord> {
    const row = this.mapDraftToRow(draft);
    return from(this.supabase.from('profiles').insert(row).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToRecord(data);
      }),
    );
  }

  updateUser(id: string, draft: Partial<ManagedUserDraft>): Observable<ManagedUserRecord> {
    const row = this.mapDraftToRow(draft);
    return from(
      this.supabase.from('profiles').update(row).eq('id', id).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToRecord(data);
      }),
    );
  }

  deleteUser(id: string): Observable<void> {
    return from(this.supabase.from('profiles').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToRecord(p: any): ManagedUserRecord {
    return {
      id: p.id,
      email: p.email,
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.role as UserRole,
      active: p.active,
      address: p.address ?? '',
      area: p.area ?? '',
      community: p.community ?? 'madrid',
      weeklyHoursTarget: p.weekly_hours_target ?? 40,
      managerId: p.manager_id ?? null,
      vacationDates: p.vacation_dates ?? [],
      avatar: p.avatar ?? undefined,
    };
  }

  private mapDraftToRow(draft: Partial<ManagedUserDraft>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (draft.email !== undefined) row['email'] = draft.email;
    if (draft.firstName !== undefined) row['first_name'] = draft.firstName;
    if (draft.lastName !== undefined) row['last_name'] = draft.lastName;
    if (draft.role !== undefined) row['role'] = draft.role;
    if (draft.active !== undefined) row['active'] = draft.active;
    if (draft.address !== undefined) row['address'] = draft.address;
    if (draft.area !== undefined) row['area'] = draft.area;
    if (draft.community !== undefined) row['community'] = draft.community;
    if (draft.weeklyHoursTarget !== undefined) row['weekly_hours_target'] = draft.weeklyHoursTarget;
    if (draft.managerId !== undefined) row['manager_id'] = draft.managerId;
    if (draft.vacationDates !== undefined) row['vacation_dates'] = draft.vacationDates;
    if (draft.avatar !== undefined) row['avatar'] = draft.avatar;
    return row;
  }
}
