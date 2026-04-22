import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkforceDashboard } from '../../domain/models/workforce-summary.model';
import { GetWorkforceDashboardUseCase } from '../use-cases/workforce/get-workforce-dashboard.usecase';

@Injectable({ providedIn: 'root' })
export class WorkforceFacade {
  private readonly getDashboardUC = inject(GetWorkforceDashboardUseCase);

  getDashboard(managerId?: string): Observable<WorkforceDashboard> {
    return this.getDashboardUC.execute(managerId);
  }
}
