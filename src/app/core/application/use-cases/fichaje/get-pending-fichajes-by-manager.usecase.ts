import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FichajePort, FICHAJE_PORT_TOKEN } from '../../ports/fichaje.port';
import { PendingFichajeWithUser } from '../../../domain/entities/fichaje.entity';

@Injectable({ providedIn: 'root' })
export class GetPendingFichajesByManagerUseCase {
  constructor(@Inject(FICHAJE_PORT_TOKEN) private fichajePort: FichajePort) {}

  execute(managerId: string): Observable<PendingFichajeWithUser[]> {
    return this.fichajePort.getPendingByManager(managerId);
  }
}
