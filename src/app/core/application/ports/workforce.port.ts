import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkforceDashboard } from '../../domain/models/workforce-summary.model';

export interface WorkforcePort {
  getDashboard(managerId?: string): Observable<WorkforceDashboard>;
}

export const WORKFORCE_PORT_TOKEN = new InjectionToken<WorkforcePort>('WorkforcePort');
