import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GetPendingFichajesByManagerUseCase } from '../use-cases/fichaje/get-pending-fichajes-by-manager.usecase';
import { ApproveFichajeUseCase } from '../use-cases/fichaje/approve-fichaje.usecase';
import { RejectFichajeUseCase } from '../use-cases/fichaje/reject-fichaje.usecase';
import { PendingFichajeWithUser, FichajeEntity } from '../../domain/entities/fichaje.entity';

@Injectable({ providedIn: 'root' })
export class FichajeApprovalFacade {
  private readonly getPending = inject(GetPendingFichajesByManagerUseCase);
  private readonly approveFichaje = inject(ApproveFichajeUseCase);
  private readonly rejectFichaje = inject(RejectFichajeUseCase);

  getPendingByManager(managerId: string): Observable<PendingFichajeWithUser[]> {
    return this.getPending.execute(managerId);
  }

  approve(id: string, managerId: string, comment?: string): Observable<FichajeEntity> {
    return this.approveFichaje.execute(id, managerId, comment);
  }

  reject(id: string, managerId: string, reason: string): Observable<FichajeEntity> {
    return this.rejectFichaje.execute(id, managerId, reason);
  }
}
