import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { TeamReportEntry } from '../../../core/domain/entities/team-report.entity';
import { ReportesFacade } from '../../../core/application/services/reportes.facade';
import { UiTableColumn, UiTableComponent } from '../../../shared/ui/table/ui-table';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, UiTableComponent],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class ReportesPage {
  private readonly authService = inject(AuthService);
  private readonly reportesFacade = inject(ReportesFacade);
  private readonly destroyRef = inject(DestroyRef);

  private readonly allRows = signal<TeamReportEntry[]>([]);
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
      if (from && row.dateIso < from) return false;
      if (to && row.dateIso > to) return false;
      if (user !== 'all' && row.userId !== user) return false;
      if (area !== 'all' && row.area !== area) return false;
      return true;
    });
  });

  userOptions = computed(() => {
    const unique = new Map<string, string>();
    for (const row of this.allRows()) {
      if (!unique.has(row.userId)) unique.set(row.userId, row.fullName);
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

  uniquePeople = computed(() => new Set(this.visibleRows().map(row => row.userId)).size);

  totalWorkedMinutes = computed(() =>
    this.visibleRows().reduce((acc, row) => acc + row.totalMinutes, 0),
  );

  totalWorkedHoursLabel = computed(() => {
    const minutes = this.totalWorkedMinutes();
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
  });

  statusAlertCount = computed(() =>
    this.visibleRows().filter(row => {
      const s = row.status.toLowerCase();
      return s.includes('late') || s.includes('incidence') || s.includes('alert');
    }).length,
  );

  printReport(): void { window.print(); }

  updateFilterFrom(event: Event): void {
    this.filterFrom.set((event.target as HTMLInputElement).value ?? '');
  }

  updateFilterTo(event: Event): void {
    this.filterTo.set((event.target as HTMLInputElement).value ?? '');
  }

  updateSelectedUser(event: Event): void {
    this.selectedUser.set((event.target as HTMLSelectElement).value ?? 'all');
  }

  updateSelectedArea(event: Event): void {
    this.selectedArea.set((event.target as HTMLSelectElement).value ?? 'all');
  }

  private loadRows(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const now = new Date();
    const toIso = now.toISOString().substring(0, 10);
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const fromIso = fromDate.toISOString().substring(0, 10);

    const load$ = currentUser.role === UserRole.ADMIN
      ? this.reportesFacade.getAll(fromIso, toIso)
      : this.reportesFacade.getForManager(currentUser.id, fromIso, toIso);

    load$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => this.allRows.set(rows),
      error: () => this.allRows.set([]),
    });
  }
}
