import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidenciaEntity } from '../../../domain/entities/incidencia.entity';
import { INCIDENCIAS_PORT_TOKEN } from '../../ports/incidencias.port';

@Injectable({ providedIn: 'root' })
export class GetIncidenciasByManagerUseCase {
  private readonly port = inject(INCIDENCIAS_PORT_TOKEN);

  execute(managerId: string): Observable<IncidenciaEntity[]> {
    return this.port.getByManager(managerId);
  }
}
