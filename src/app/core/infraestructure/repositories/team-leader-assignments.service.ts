import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseClientService } from '../supabase/supabase-client.service';

interface TeamLeaderAssignmentRow {
  id: string;
  employee_id: string;
  team_leader_id: string;
  status: 'active' | 'pending_change' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class TeamLeaderAssignmentsService {
  private readonly supabase = inject(SupabaseClientService).client;

  getActiveAssignments(): Observable<TeamLeaderAssignmentRow[]> {
    return from(
      this.supabase
        .from('team_leader_assignments')
        .select('id,employee_id,team_leader_id,status')
        .eq('status', 'active'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw { code: error.code, message: error.message };
        return (data ?? []) as TeamLeaderAssignmentRow[];
      }),
    );
  }

  assignEmployee(employeeId: string, teamLeaderId: string, assignedBy: string): Observable<void> {
    return from(
      this.supabase
        .from('team_leader_assignments')
        .upsert(
          {
            employee_id: employeeId,
            team_leader_id: teamLeaderId,
            assigned_by: assignedBy,
            status: 'active',
            requested_team_leader_id: null,
            manager_decision_note: null,
          },
          { onConflict: 'employee_id' },
        ),
    ).pipe(
      map(({ error }) => {
        if (error) throw { code: error.code, message: error.message };
      }),
    );
  }
}
