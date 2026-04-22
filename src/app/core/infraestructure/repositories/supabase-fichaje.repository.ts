import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FichajeEntity, PendingFichajeWithUser } from '../../domain/entities/fichaje.entity';
import { FichajePort } from '../../application/ports/fichaje.port';
import { FichajeMapper } from '../../domain/mappers/fichaje.mapper';
import { SupabaseClientService } from '../supabase/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseFichajeRepository implements FichajePort {
  private readonly supabase = inject(SupabaseClientService).client;

  getPendingByManager(managerId: string): Observable<PendingFichajeWithUser[]> {
    return from(
      this.supabase
        .from('fichajes')
        .select('*, profiles:user_id(first_name, last_name)')
        .eq('manager_id', managerId)
        .eq('status', 'PENDING')
        .order('submitted_at'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((r: any) => FichajeMapper.toDomainWithUser(r));
      }),
    );
  }

  getByUser(userId: string): Observable<FichajeEntity[]> {
    return from(
      this.supabase
        .from('fichajes')
        .select('*')
        .eq('user_id', userId)
        .order('date_iso', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((r: any) => FichajeMapper.toDomain(r));
      }),
    );
  }

  create(fichaje: Omit<FichajeEntity, 'id'>): Observable<FichajeEntity> {
    return from(
      this.supabase
        .from('fichajes')
        .insert({
          user_id: fichaje.userId,
          date_iso: fichaje.date_iso,
          hours: fichaje.hours,
          description: fichaje.description,
          status: fichaje.status,
          submitted_by: fichaje.submittedBy,
          submitted_at: fichaje.submittedAt,
          manager_id: fichaje.managerId ?? null,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return FichajeMapper.toDomain(data);
      }),
    );
  }

  approve(id: string, managerId: string, comment?: string): Observable<FichajeEntity> {
    return from(
      this.supabase
        .from('fichajes')
        .update({
          status: 'APPROVED',
          manager_id: managerId,
          approved_at: new Date().toISOString(),
          manager_comment: comment ?? null,
        })
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return FichajeMapper.toDomain(data);
      }),
    );
  }

  reject(id: string, managerId: string, reason: string): Observable<FichajeEntity> {
    return from(
      this.supabase
        .from('fichajes')
        .update({ status: 'REJECTED', manager_id: managerId, rejection_reason: reason })
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return FichajeMapper.toDomain(data);
      }),
    );
  }
}


