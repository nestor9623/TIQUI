import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { MockJsonLoaderService } from '../../../core/mock/services/mock-json-loader.service';
import { MOCK_PATHS } from '../../../core/mock/mock-config';
import { ReportMockDTO } from '../../../core/domain/entities/report.entity';
import { UiTableColumn, UiTableComponent } from '../../../shared/ui/table/ui-table';

interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'employee';
  area?: string;
  managerId?: string | null;
}

interface ReportRow {
  userId: string;
  fullName: string;
  area: string;
  dateIso: string;
  workedHours: string;
  status: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, UiTableComponent],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class ReportesPage {
  private readonly authService = inject(AuthService);
  private readonly jsonLoader = inject(MockJsonLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly allRows = signal<ReportRow[]>([]);
  filterFrom = signal('');
  filterTo = signal('');
  selectedUser = signal('all');
  selectedArea = signal('all');
  tableColumns: UiTableColumn[] = [
    { key: 'dateIso', label: 'Fecha' },
    { key: 'fullName', label: 'Persona' },
    { key: 'area', label: 'Área' },
    { key: 'workedHours', label: 'Horas', align: 'right' },
    { key: 'status', label: 'Estado' },
  ];

  constructor() {
    this.loadRows();
  }

  visibleRows = computed(() => {
    const from = this.filterFrom();
    const to = this.filterTo();
    const user = this.selectedUser();
    const area = this.selectedArea();

    return this.allRows().filter(row => {
      if (from && row.dateIso < from) {
        return false;
      }
      if (to && row.dateIso > to) {
        return false;
      }
      if (user !== 'all' && row.userId !== user) {
        return false;
      }
      if (area !== 'all' && row.area !== area) {
        return false;
      }
      return true;
    });
  });

  userOptions = computed(() => {
    const unique = new Map<string, string>();
    for (const row of this.allRows()) {
      if (!unique.has(row.userId)) {
        unique.set(row.userId, row.fullName);
      }
    }
    return [...unique.entries()].map(([id, label]) => ({ id, label }));
  });

  areaOptions = computed(() => [...new Set(this.allRows().map(row => row.area))].sort());

  tableRows = computed(() => this.visibleRows().map(row => ({
    dateIso: row.dateIso,
    fullName: row.fullName,
    area: row.area,
    workedHours: row.workedHours,
    status: row.status,
  })));

  totalRows = computed(() => this.visibleRows().length);

  uniquePeople = computed(() => {
    const ids = new Set(this.visibleRows().map(row => row.userId));
    return ids.size;
  });

  totalWorkedMinutes = computed(() => {
    return this.visibleRows().reduce((acc, row) => acc + this.parseWorkedMinutes(row.workedHours), 0);
  });

  totalWorkedHoursLabel = computed(() => {
    const minutes = this.totalWorkedMinutes();
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours}h ${String(rest).padStart(2, '0')}m`;
  });

  statusAlertCount = computed(() => {
    return this.visibleRows().filter(row => {
      const normalized = row.status.toLowerCase();
      return normalized.includes('late') || normalized.includes('incidence') || normalized.includes('alert');
    }).length;
  });

  printReport(): void {
    window.print();
  }

  updateFilterFrom(value: string | null): void {
    this.filterFrom.set(value ?? '');
  }

  updateFilterTo(value: string | null): void {
    this.filterTo.set(value ?? '');
  }

  updateSelectedUser(value: string | null): void {
    this.selectedUser.set(value ?? 'all');
  }

  updateSelectedArea(value: string | null): void {
    this.selectedArea.set(value ?? 'all');
  }

  private loadRows(): void {
    this.jsonLoader.loadJson<UserDto[]>(MOCK_PATHS.users)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => {
        this.jsonLoader.loadJson<ReportMockDTO[]>(MOCK_PATHS.monthlyReports)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(reports => {
            const currentUser = this.authService.getCurrentUser();
            const rows = reports.flatMap(report => {
              const owner = users.find(user => user.id === report.user_id);
              if (!owner) {
                return [];
              }

              if (currentUser?.role === UserRole.EMPLOYEE && owner.id !== currentUser.id) {
                return [];
              }
              if (currentUser?.role === UserRole.MANAGER && owner.managerId !== currentUser.id) {
                return [];
              }

              return [{
                userId: owner.id,
                fullName: `${owner.firstName} ${owner.lastName}`,
                area: owner.area ?? 'Sin área',
                dateIso: report.date_iso,
                workedHours: report.worked_hours,
                status: report.day_status,
              }];
            });

            this.allRows.set(rows.sort((left, right) => right.dateIso.localeCompare(left.dateIso)));
          });
      });
  }

  private parseWorkedMinutes(value: string): number {
    const match = value.match(/(\d+)h\s*(\d+)m/i);
    if (!match) {
      return 0;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  }
}
