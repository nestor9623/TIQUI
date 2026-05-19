import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, from, map } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { SupabaseFichajeRepository } from '../../../../core/infraestructure/repositories/supabase-fichaje.repository';
import { SupabaseVacacionesService } from '../../../../core/infraestructure/repositories/supabase-vacaciones.service';
import { SupabaseClientService } from '../../../../core/infraestructure/supabase/supabase-client.service';

interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  kind: 'fichaje' | 'vacacion' | 'incidencia';
  sortDate: Date;
}

interface IncidenciaHistoryRow {
  id: string;
  type: string;
  status: string;
  date_iso: string;
  description: string;
  created_at: string;
}

@Component({
  selector: 'app-recent-activity',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
})
export class RecentActivityComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fichajeRepository = inject(SupabaseFichajeRepository);
  private readonly vacacionesService = inject(SupabaseVacacionesService);
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly destroyRef = inject(DestroyRef);

  activities = signal<Activity[]>([]);

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? '3';

    forkJoin({
      fichajes: this.fichajeRepository.getByUser(userId),
      vacaciones: this.vacacionesService.getMyRequests(userId),
      incidencias: from(
        this.supabase
          .from('incidencias')
          .select('id,type,status,date_iso,description,created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
      ).pipe(
        map(({ data }) => (data ?? []) as IncidenciaHistoryRow[]),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ fichajes, vacaciones, incidencias }) => {
        const fichajeActivities: Activity[] = fichajes.map(item => ({
          id: `fichaje-${item.id}`,
          title: `Fichaje ${this.translateStatus(item.status)}`,
          description: `${this.formatShortDate(item.date_iso)} · ${item.hours}`,
          timestamp: this.formatDateTime(item.submittedAt || item.date_iso),
          kind: 'fichaje',
          sortDate: this.toDate(item.submittedAt || item.date_iso),
        }));

        const vacationActivities: Activity[] = vacaciones.map(item => ({
          id: `vacacion-${item.id}`,
          title: `Vacaciones ${this.translateVacationStatus(item.status)}`,
          description: `${this.formatShortDate(item.start_date)} - ${this.formatShortDate(item.end_date)} · ${item.days_count} dias`,
          timestamp: this.formatDateTime(item.updated_at || item.created_at),
          kind: 'vacacion',
          sortDate: this.toDate(item.updated_at || item.created_at),
        }));

        const incidenciaActivities: Activity[] = incidencias.map(item => ({
          id: `incidencia-${item.id}`,
          title: `Incidencia ${this.translateStatus(item.status)}`,
          description: `${item.type} · ${item.description}`,
          timestamp: this.formatDateTime(item.created_at || item.date_iso),
          kind: 'incidencia',
          sortDate: this.toDate(item.created_at || item.date_iso),
        }));

        const merged = [...fichajeActivities, ...vacationActivities, ...incidenciaActivities]
          .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
          .slice(0, 14);

        this.activities.set(merged);
      });
  }

  badgeLabel(kind: Activity['kind']): string {
    if (kind === 'vacacion') return 'Vacaciones';
    if (kind === 'incidencia') return 'Incidencia';
    return 'Fichaje';
  }

  private translateStatus(status: string): string {
    const normalized = String(status).toUpperCase();
    if (normalized === 'APPROVED') return 'aprobado';
    if (normalized === 'REJECTED') return 'rechazado';
    if (normalized === 'PENDING') return 'pendiente';
    return String(status).toLowerCase();
  }

  private translateVacationStatus(status: string): string {
    const normalized = String(status).toLowerCase();
    if (normalized === 'approved') return 'aprobadas';
    if (normalized === 'rejected') return 'rechazadas';
    if (normalized === 'cancelled') return 'canceladas';
    if (normalized === 'pending') return 'pendientes';
    return normalized;
  }

  private formatShortDate(value: string): string {
    return this.toDate(value).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatDateTime(value: string): string {
    return this.toDate(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private toDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  }
}
