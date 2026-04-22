import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { MOCK_PATHS } from '../mock-config';
import { MockJsonLoaderService } from './mock-json-loader.service';
import { ReportMockDTO } from '../../domain/entities/report.entity';

interface MockUserData {
  id: string;
  role: 'admin' | 'manager' | 'employee';
  firstName: string;
  lastName: string;
  area?: string;
  active: boolean;
  managerId?: string | null;
}

interface PendingFichajeDto {
  id: string;
  userId: string;
  date_iso: string;
  hours: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerId?: string;
}

interface ApprovedIncidentRecord {
  id: string;
  note: string;
  approvedAt: string;
}

export type WorkforceStatus = 'active' | 'paused' | 'away';

export interface WorkforcePerson {
  id: string;
  status: WorkforceStatus;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface AdminLocationPoint {
  id: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  total: number;
  active: number;
  paused: number;
  away: number;
  percentage: number;
}

export interface AdminWorkforceSummary {
  total: number;
  active: number;
  onPause: number;
  absent: number;
}

export interface AdminIncident {
  id: string;
  userId: string;
  fullName: string;
  type: 'missing-checkin' | 'pending-approval';
  dateIso: string;
}

export interface AdminDashboardData {
  summary: AdminWorkforceSummary;
  locations: AdminLocationPoint[];
  incidents: AdminIncident[];
  overtimeByEmployee: Array<{
    userId: string;
    fullName: string;
    extraMinutes: number;
  }>;
}

const APPROVED_INCIDENTS_STORAGE_KEY = 'tiqui.dashboard.approved-incidents';

@Injectable({ providedIn: 'root' })
export class MockWorkforceDashboardService {
  constructor(private readonly jsonLoader: MockJsonLoaderService) {}

  approveIncidents(ids: string[], note: string = ''): void {
    if (ids.length === 0) {
      return;
    }

    const records = this.readApprovedIncidents();
    const approvedAt = new Date().toISOString();

    for (const id of ids) {
      records.set(id, { id, note, approvedAt });
    }

    localStorage.setItem(APPROVED_INCIDENTS_STORAGE_KEY, JSON.stringify([...records.values()]));
  }

  getDashboardData(managerId?: string): Observable<AdminDashboardData> {
    return combineLatest([
      this.jsonLoader.loadJson<MockUserData[]>(MOCK_PATHS.users),
      this.jsonLoader.loadJson<ReportMockDTO[]>(MOCK_PATHS.monthlyReports),
      this.jsonLoader.loadJson<PendingFichajeDto[]>(MOCK_PATHS.pendingFichajes),
    ]).pipe(
      map(([users, reports, pendingFichajes]) => {
        const visibleUsers = this.filterVisibleUsers(users, managerId);
        const roster = this.buildRoster(visibleUsers, reports);
        const summary: AdminWorkforceSummary = {
          total: roster.length,
          active: roster.filter(person => person.status === 'active').length,
          onPause: roster.filter(person => person.status === 'paused').length,
          absent: roster.filter(person => person.status === 'away').length,
        };

        const grouped = new Map<string, Omit<AdminLocationPoint, 'percentage'>>();

        for (const person of roster) {
          const key = `${person.country}-${person.city}`;
          const existing = grouped.get(key);
          if (existing) {
            existing.total += 1;
            if (person.status === 'active') {
              existing.active += 1;
            } else if (person.status === 'paused') {
              existing.paused += 1;
            } else {
              existing.away += 1;
            }
            continue;
          }

          grouped.set(key, {
            id: key,
            country: person.country,
            city: person.city,
            latitude: person.latitude,
            longitude: person.longitude,
            total: 1,
            active: person.status === 'active' ? 1 : 0,
            paused: person.status === 'paused' ? 1 : 0,
            away: person.status === 'away' ? 1 : 0,
          });
        }

        const locations = [...grouped.values()]
          .map(location => ({
            ...location,
            percentage: summary.total === 0 ? 0 : Number(((location.total / summary.total) * 100).toFixed(1)),
          }))
          .sort((a, b) => b.total - a.total);

        return {
          summary,
          locations,
          incidents: this.buildIncidents(visibleUsers, reports, pendingFichajes),
          overtimeByEmployee: this.buildOvertimeByEmployee(visibleUsers, reports),
        };
      }),
    );
  }

  private filterVisibleUsers(users: MockUserData[], managerId?: string): MockUserData[] {
    const employees = users.filter(user => user.role === 'employee');
    if (!managerId) {
      return employees;
    }
    return employees.filter(user => user.managerId === managerId);
  }

  private buildRoster(users: MockUserData[], reports: ReportMockDTO[]): WorkforcePerson[] {
    const cityByArea: Record<string, { country: string; city: string; latitude: number; longitude: number }> = {
      Operaciones: { country: 'Spain', city: 'A Coruña', latitude: 43.3623, longitude: -8.4115 },
      Soporte: { country: 'Spain', city: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
      Finanzas: { country: 'Spain', city: 'Barcelona', latitude: 41.3874, longitude: 2.1686 },
      default: { country: 'Spain', city: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
    };

    return users.map(user => {
      const latest = reports
        .filter(report => report.user_id === user.id)
        .sort((left, right) => right.date_iso.localeCompare(left.date_iso))[0];
      const status = this.toWorkforceStatus(latest?.day_status, user.active);
      const location = cityByArea[user.area ?? 'default'] ?? cityByArea['default'];
      return {
        id: user.id,
        status,
        country: location.country,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    });
  }

  private toWorkforceStatus(dayStatus: string | undefined, active: boolean): WorkforceStatus {
    if (!active) {
      return 'away';
    }
    if (dayStatus === 'clocked-in') {
      return 'active';
    }
    if (dayStatus === 'on-pause') {
      return 'paused';
    }
    return 'away';
  }

  private buildIncidents(
    users: MockUserData[],
    reports: ReportMockDTO[],
    pendingFichajes: PendingFichajeDto[],
  ): AdminDashboardData['incidents'] {
    const userById = new Map(users.map(user => [user.id, user]));
    const approvedIds = new Set(this.readApprovedIncidents().keys());
    const incidents: AdminDashboardData['incidents'] = [];

    for (const report of reports) {
      if (report.day_status !== 'not-clocked') {
        continue;
      }
      const user = userById.get(report.user_id);
      if (!user) {
        continue;
      }
      const id = this.buildIncidentId(user.id, 'missing-checkin', report.date_iso);
      if (approvedIds.has(id)) {
        continue;
      }
      incidents.push({
        id,
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        type: 'missing-checkin',
        dateIso: report.date_iso,
      });
    }

    for (const fichaje of pendingFichajes) {
      if (fichaje.status !== 'PENDING') {
        continue;
      }
      const user = userById.get(fichaje.userId);
      if (!user) {
        continue;
      }
      const id = this.buildIncidentId(user.id, 'pending-approval', fichaje.date_iso);
      if (approvedIds.has(id)) {
        continue;
      }
      incidents.push({
        id,
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        type: 'pending-approval',
        dateIso: fichaje.date_iso,
      });
    }

    return incidents.sort((left, right) => right.dateIso.localeCompare(left.dateIso)).slice(0, 8);
  }

  private buildOvertimeByEmployee(
    users: MockUserData[],
    reports: ReportMockDTO[],
  ): AdminDashboardData['overtimeByEmployee'] {
    const userById = new Map(users.map(user => [user.id, user]));
    const extraByUser = new Map<string, number>();

    for (const report of reports) {
      const workedMinutes = this.parseMinutes(report.worked_hours);
      const extra = Math.max(workedMinutes - (8 * 60), 0);
      if (extra <= 0 || !userById.has(report.user_id)) {
        continue;
      }
      const current = extraByUser.get(report.user_id) ?? 0;
      extraByUser.set(report.user_id, current + extra);
    }

    return [...extraByUser.entries()]
      .map(([userId, extraMinutes]) => {
        const user = userById.get(userId);
        return {
          userId,
          fullName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          extraMinutes,
        };
      })
      .sort((a, b) => b.extraMinutes - a.extraMinutes);
  }

  private buildIncidentId(userId: string, type: AdminIncident['type'], dateIso: string): string {
    return `${userId}::${type}::${dateIso}`;
  }

  private readApprovedIncidents(): Map<string, ApprovedIncidentRecord> {
    const raw = localStorage.getItem(APPROVED_INCIDENTS_STORAGE_KEY);
    if (!raw) {
      return new Map();
    }

    try {
      const parsed = JSON.parse(raw) as ApprovedIncidentRecord[];
      return new Map(parsed.map(item => [item.id, item]));
    } catch {
      return new Map();
    }
  }

  private parseMinutes(workedHours: string): number {
    const [hoursPart, minutesPart] = workedHours.split('h');
    const hours = Number(hoursPart.trim());
    const minutes = Number((minutesPart ?? '0m').replace('m', '').trim());
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  }
}
