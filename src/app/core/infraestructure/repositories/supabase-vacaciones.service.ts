import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import {
  VacationRequestRow,
  VacationRequestInsert,
  VacationRequestStatus,
  VacationBalanceRpcRow,
} from '../supabase/database.types';
import { UserRole } from '../../auth/models/auth.model';

export interface VacationBalance {
  code: string;
  label: string;
  available: number;
  total: number;
  used: number;
  expiresMonth: number | null;
  isAnnual: boolean;
}

export interface VacationRequest extends VacationRequestRow {
  user_name?: string;
}

export interface VacationOverlap {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  days_count: number;
}

interface VacationTypeCatalogRow {
  code: string;
  label: string;
  days_per_year: number;
  expires_month: number | null;
  is_annual: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupabaseVacacionesService {
  private readonly supabase = inject(SupabaseClientService).client;

  // ─── Balances ───────────────────────────────────────────────

  /** Obtiene los balances de vacaciones de un empleado desde BD */
  getBalancesForUser(userId: string): Observable<VacationBalance[]> {
    return from(
      this.supabase.rpc('get_vacation_balances_for_user', { p_user_id: userId }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw { code: error.code, message: error.message };
        return (data ?? [] as VacationBalanceRpcRow[]).map((row: VacationBalanceRpcRow) => ({
          code: row.code,
          label: row.label,
          total: row.total_days,
          used: row.used_days,
          available: row.available_days,
          expiresMonth: row.expires_month,
          isAnnual: row.is_annual,
        }));
      }),
    );
  }

  /** Fallback: obtiene tipos activos del catálogo si el RPC no está disponible */
  getCatalogBalancesFallback(): Observable<VacationBalance[]> {
    return from(
      this.supabase
        .from('vacation_type_catalog')
        .select('code,label,days_per_year,expires_month,is_annual,sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw { code: error.code, message: error.message };
        return ((data ?? []) as VacationTypeCatalogRow[]).map(row => ({
          code: row.code,
          label: row.label,
          total: row.days_per_year,
          used: 0,
          available: row.days_per_year,
          expiresMonth: row.expires_month,
          isAnnual: row.is_annual,
        }));
      }),
    );
  }

  // ─── Festivos ────────────────────────────────────────────────

  /** Obtiene festivos (nacionales + comunidad) para un año dado */
  getHolidaysForCommunity(community: string, year: number): Observable<Set<string>> {
    return from(
      this.supabase.rpc('get_holidays_for_community', { p_community: community, p_year: year }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw { code: error.code, message: error.message };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dates = new Set<string>((data ?? []).map((h: any) => String(h.date).slice(0, 10)));
        return dates;
      }),
    );
  }

  /** Días hábiles entre dos fechas descontando festivos de la comunidad del empleado */
  calcBusinessDaysWithHolidays(start: string, end: string, holidays: Set<string>): number {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dow = current.getDay();
      const iso = current.toISOString().slice(0, 10);
      if (dow !== 0 && dow !== 6 && !holidays.has(iso)) count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /** Versión síncrona (sin festivos) usada como fallback o cálculo rápido */
  calcBusinessDays(start: string, end: string): number {
    return this.calcBusinessDaysWithHolidays(start, end, new Set());
  }

  // ─── Solapamiento ────────────────────────────────────────────

  /** Comprueba si el rango solicitado se solapa con vacaciones existentes del empleado */
  checkOverlap(userId: string, start: string, end: string, excludeId?: string): Observable<VacationOverlap[]> {
    return from(
      this.supabase.rpc('check_vacation_overlap', {
        p_user_id:    userId,
        p_start:      start,
        p_end:        end,
        p_exclude_id: excludeId ?? null,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw { code: error.code, message: error.message };
        return (data ?? []) as VacationOverlap[];
      }),
    );
  }

  /** Comprueba si el usuario está de vacaciones en una fecha concreta */
  isUserOnVacation(userId: string, date: string): Observable<boolean> {
    return from(
      this.supabase.rpc('is_user_on_vacation', { p_user_id: userId, p_date: date }),
    ).pipe(
      map(({ data, error }) => {
        if (error) return false;
        return Boolean(data);
      }),
    );
  }

  // ─── Pendientes manager / admin ──────────────────────────────

  /** Get pending requests for reviewer. Managers see own team, admins see all. */
  getPendingRequestsForReviewer(role: UserRole, _reviewerId: string): Observable<VacationRequest[]> {
    if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
      return from(
        this.supabase.rpc('get_pending_vacation_requests_for_reviewer'),
      ).pipe(
        map(({ data, error }) => {
          if (error) throw { code: error.code, message: error.message };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (data ?? []).map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            manager_id: row.manager_id,
            vacation_type: row.vacation_type,
            start_date: row.start_date,
            end_date: row.end_date,
            days_count: row.days_count,
            notes: row.notes,
            status: row.status,
            manager_comment: row.manager_comment,
            created_at: row.created_at,
            updated_at: row.updated_at,
            user_name: row.user_name,
          } as VacationRequest));
        }),
      );
    }

    return of([]);
  }

  /** Backward-compatible alias for existing manager call sites */
  getPendingRequests(managerId: string): Observable<VacationRequest[]> {
    return this.getPendingRequestsForReviewer(UserRole.MANAGER, managerId);
  }

  // ─── Mis solicitudes ─────────────────────────────────────────

  /** Get vacation requests for an employee */
  getMyRequests(userId: string): Observable<VacationRequest[]> {
    return from(
      this.supabase
        .from('vacation_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw { code: error.code, message: error.message };
        return data ?? [];
      }),
    );
  }

  // ─── Crear solicitud ─────────────────────────────────────────

  /** Submit a new vacation request */
  createRequest(payload: VacationRequestInsert): Observable<VacationRequest> {
    const managerId$ = payload.manager_id
      ? of(payload.manager_id)
      : from(
        this.supabase
          .from('profiles')
          .select('manager_id')
          .eq('id', payload.user_id)
          .maybeSingle(),
      ).pipe(
        map(({ data, error }) => {
          if (error) throw { code: error.code, message: error.message };
          return data?.manager_id ?? null;
        }),
      );

    return managerId$.pipe(
      switchMap(managerId => from(
        this.supabase
          .from('vacation_requests')
          .insert({ ...payload, manager_id: managerId })
          .select()
          .single(),
      )),
      map(({ data, error }) => {
        if (error || !data) throw { code: error?.code, message: error?.message ?? 'Error al crear la solicitud' };
        return data;
      }),
    );
  }

  // ─── Revisión manager ────────────────────────────────────────

  /** Manager approves or rejects a request */
  reviewRequest(
    requestId: string,
    status: Extract<VacationRequestStatus, 'approved' | 'rejected'>,
    managerComment?: string,
  ): Observable<void> {
    return from(
      this.supabase
        .from('vacation_requests')
        .update({ status, manager_comment: managerComment ?? null, updated_at: new Date().toISOString() })
        .eq('id', requestId),
    ).pipe(
      map(({ error }) => {
        if (error) throw { code: error.code, message: error.message };
      }),
    );
  }

  /** Cancel own request (employee) */
  cancelRequest(requestId: string, userId: string): Observable<void> {
    return from(
      this.supabase
        .from('vacation_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'pending'),
    ).pipe(
      map(({ error }) => {
        if (error) throw { code: error.code, message: error.message };
      }),
    );
  }
}

