import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkforceDashboard } from '../../../domain/models/workforce-summary.model';
import { WORKFORCE_PORT_TOKEN } from '../../ports/workforce.port';

@Injectable({ providedIn: 'root' })
export class GetWorkforceDashboardUseCase {
  private readonly port = inject(WORKFORCE_PORT_TOKEN);

  execute(managerId?: string): Observable<WorkforceDashboard> {
    return this.port.getDashboard(managerId);
  }
}
