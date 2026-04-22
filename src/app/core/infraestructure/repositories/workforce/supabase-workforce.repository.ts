import { inject, Injectable } from '@angular/core';
import { forkJoin, from, map, Observable } from 'rxjs';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { WorkforcePort } from '../../../application/ports/workforce.port';
import { WorkforceDashboard, WorkforceLocationPoint, WorkforceSummary } from '../../../domain/models/workforce-summary.model';

interface CommunityMeta { lat: number; lng: number; city: string; country: string }

const COMMUNITY_META: Record<string, CommunityMeta> = {
  madrid: { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'España' },
  galicia: { lat: 42.8782, lng: -8.5448, city: 'A Coruña', country: 'España' },
};

const DEFAULT_META: CommunityMeta = { lat: 40.4168, lng: -3.7038, city: 'España', country: 'España' };

@Injectable({ providedIn: 'root' })
export class SupabaseWorkforceRepository implements WorkforcePort {
  private readonly supabase = inject(SupabaseClientService).client;

  getDashboard(managerId?: string): Observable<WorkforceDashboard> {
    const today = new Date().toISOString().substring(0, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profilesQ: any = this.supabase
      .from('profiles')
      .select('id, community, active')
      .eq('role', 'employee')
      .eq('active', true);

    if (managerId) {
      profilesQ = profilesQ.eq('manager_id', managerId);
    }

    const dailyQ = this.supabase
      .from('daily_reports')
      .select('user_id, day_status')
      .eq('date_iso', today);

    return forkJoin([from(profilesQ), from(dailyQ)]).pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map(([profilesRes, dailyRes]: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles: any[] = profilesRes.data ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dailyMap = new Map<string, string>((dailyRes.data ?? []).map((r: any) => [r.user_id as string, r.day_status as string]));

        let totalActive = 0;
        let totalOnPause = 0;
        let totalAbsent = 0;

        const commAgg = new Map<string, { active: number; onPause: number; absent: number }>();

        for (const p of profiles) {
          const status = dailyMap.get(p.id);
          const comm = (p.community as string) ?? 'madrid';

          if (!commAgg.has(comm)) {
            commAgg.set(comm, { active: 0, onPause: 0, absent: 0 });
          }
          const agg = commAgg.get(comm)!;

          if (status === 'clocked-in') {
            totalActive++;
            agg.active++;
          } else if (status === 'on-pause') {
            totalOnPause++;
            agg.onPause++;
          } else {
            totalAbsent++;
            agg.absent++;
          }
        }

        const total = profiles.length;
        const summary: WorkforceSummary = { total, active: totalActive, onPause: totalOnPause, absent: totalAbsent };

        const locations: WorkforceLocationPoint[] = [...commAgg.entries()].map(([comm, counts]) => {
          const meta = COMMUNITY_META[comm] ?? DEFAULT_META;
          const locTotal = counts.active + counts.onPause + counts.absent;
          return {
            id: comm,
            lat: meta.lat,
            lng: meta.lng,
            city: meta.city,
            country: meta.country,
            total: locTotal,
            active: counts.active,
            onPause: counts.onPause,
            absent: counts.absent,
            percentage: total === 0 ? 0 : Number(((locTotal / total) * 100).toFixed(1)),
          };
        });

        return { summary, locations };
      }),
    );
  }
}
