import { inject, Injectable } from '@angular/core';
import { forkJoin, from, map, Observable } from 'rxjs';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { IncidenciasPort } from '../../../application/ports/incidencias.port';
import { IncidenciaEntity } from '../../../domain/entities/incidencia.entity';

@Injectable({ providedIn: 'root' })
export class SupabaseIncidenciasRepository implements IncidenciasPort {
  private readonly supabase = inject(SupabaseClientService).client;

  getByManager(managerId: string): Observable<IncidenciaEntity[]> {
    return this.fetchIncidencias(managerId);
  }

  getAll(): Observable<IncidenciaEntity[]> {
    return this.fetchIncidencias(undefined);
  }

  private fetchIncidencias(managerId: string | undefined): Observable<IncidenciaEntity[]> {
    const today = new Date().toISOString().substring(0, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fichajeQ: any = this.supabase
      .from('fichajes')
      .select('id, user_id, date_iso, profiles:user_id(first_name, last_name, manager_id)')
      .eq('status', 'PENDING');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profilesQ: any = this.supabase
      .from('profiles')
      .select('id, first_name, last_name, manager_id')
      .eq('role', 'employee')
      .eq('active', true);

    if (managerId) {
      profilesQ = profilesQ.eq('manager_id', managerId);
    }

    const dailyQ = this.supabase
      .from('daily_reports')
      .select('user_id')
      .eq('date_iso', today)
      .neq('day_status', 'not-clocked');

    return forkJoin([from(fichajeQ), from(profilesQ), from(dailyQ)]).pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map(([fichajeRes, profilesRes, dailyRes]: any[]) => {
        const incidents: IncidenciaEntity[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fichajes: any[] = fichajeRes.data ?? [];
        for (const f of fichajes) {
          const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
          if (!profile) continue;
          if (managerId && profile.manager_id !== managerId) continue;
          incidents.push({
            id: `${f.user_id}::pending-approval::${f.date_iso}`,
            userId: f.user_id,
            fullName: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
            type: 'pending-approval',
            dateIso: f.date_iso,
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles: any[] = profilesRes.data ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clockedInIds = new Set<string>((dailyRes.data ?? []).map((r: any) => r.user_id as string));
        for (const p of profiles) {
          if (clockedInIds.has(p.id)) continue;
          incidents.push({
            id: `${p.id}::missing-checkin::${today}`,
            userId: p.id,
            fullName: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
            type: 'missing-checkin',
            dateIso: today,
          });
        }

        return incidents.sort((a, b) => b.dateIso.localeCompare(a.dateIso)).slice(0, 20);
      }),
    );
  }
}
