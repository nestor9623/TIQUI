import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FichajePort, FICHAJE_PORT_TOKEN } from '../../ports/fichaje.port';
import { FichajeEntity } from '../../../domain/entities/fichaje.entity';

@Injectable({ providedIn: 'root' })
export class ApproveFichajeUseCase {
  constructor(@Inject(FICHAJE_PORT_TOKEN) private fichajePort: FichajePort) {}

  execute(id: string, managerId: string, comment?: string): Observable<FichajeEntity> {
    return this.fichajePort.approve(id, managerId, comment);
  }
}
