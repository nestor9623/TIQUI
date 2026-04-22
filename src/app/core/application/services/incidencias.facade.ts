import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidenciaEntity } from '../../domain/entities/incidencia.entity';
import { GetIncidenciasByManagerUseCase } from '../use-cases/incidencia/get-incidencias-by-manager.usecase';
import { GetAllIncidenciasUseCase } from '../use-cases/incidencia/get-all-incidencias.usecase';

@Injectable({ providedIn: 'root' })
export class IncidenciasFacade {
  private readonly getByManagerUC = inject(GetIncidenciasByManagerUseCase);
  private readonly getAllUC = inject(GetAllIncidenciasUseCase);

  getAll(): Observable<IncidenciaEntity[]> {
    return this.getAllUC.execute();
  }

  getByManager(managerId: string): Observable<IncidenciaEntity[]> {
    return this.getByManagerUC.execute(managerId);
  }
}
