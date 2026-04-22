import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FichajePort, FICHAJE_PORT_TOKEN } from '../../ports/fichaje.port';
import { FichajeEntity } from '../../../domain/entities/fichaje.entity';

@Injectable({ providedIn: 'root' })
export class GetFichajesByUserUseCase {
  constructor(@Inject(FICHAJE_PORT_TOKEN) private fichajePort: FichajePort) {}

  execute(userId: string): Observable<FichajeEntity[]> {
    return this.fichajePort.getByUser(userId);
  }
}
