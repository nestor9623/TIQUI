import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { ProfilesPort } from '../../../application/ports/profiles.port';
import { ProfileEntity } from '../../../domain/entities/profile.entity';
import { ProfileMapper } from '../../../domain/mappers/profile.mapper';

@Injectable({ providedIn: 'root' })
export class SupabaseProfilesRepository implements ProfilesPort {
  private readonly supabase = inject(SupabaseClientService).client;

  getAll(): Observable<ProfileEntity[]> {
    const query = this.supabase
      .from('profiles')
      .select('*')
      .order('last_name', { ascending: true });
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(ProfileMapper.toDomain);
      }),
    );
  }

  getByManager(managerId: string): Observable<ProfileEntity[]> {
    const query = this.supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', managerId)
      .order('last_name', { ascending: true });
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(ProfileMapper.toDomain);
      }),
    );
  }

  update(id: string, data: Partial<ProfileEntity>): Observable<ProfileEntity> {
    const payload = ProfileMapper.toInsert(data);
    const query = this.supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return from(query).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return ProfileMapper.toDomain(row);
      }),
    );
  }
}
