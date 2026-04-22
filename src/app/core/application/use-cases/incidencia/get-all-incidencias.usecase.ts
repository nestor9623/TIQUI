import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidenciaEntity } from '../../../domain/entities/incidencia.entity';
import { INCIDENCIAS_PORT_TOKEN } from '../../ports/incidencias.port';

@Injectable({ providedIn: 'root' })
export class GetAllIncidenciasUseCase {
  private readonly port = inject(INCIDENCIAS_PORT_TOKEN);

  execute(): Observable<IncidenciaEntity[]> {
    return this.port.getAll();
  }
}
