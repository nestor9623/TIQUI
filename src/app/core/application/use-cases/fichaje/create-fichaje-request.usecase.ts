import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FichajePort, FICHAJE_PORT_TOKEN } from '../../ports/fichaje.port';
import { FichajeEntity } from '../../../domain/entities/fichaje.entity';

@Injectable({ providedIn: 'root' })
export class CreateFichajeRequestUseCase {
  constructor(@Inject(FICHAJE_PORT_TOKEN) private readonly fichajePort: FichajePort) {}

  execute(fichaje: Omit<FichajeEntity, 'id'>): Observable<FichajeEntity> {
    return this.fichajePort.create(fichaje);
  }
}
