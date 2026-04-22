import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidenciaEntity } from '../../domain/entities/incidencia.entity';

export interface IncidenciasPort {
  getByManager(managerId: string): Observable<IncidenciaEntity[]>;
  getAll(): Observable<IncidenciaEntity[]>;
}

export const INCIDENCIAS_PORT_TOKEN = new InjectionToken<IncidenciasPort>('IncidenciasPort');
