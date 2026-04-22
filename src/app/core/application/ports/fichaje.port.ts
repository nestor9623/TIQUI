import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FichajeEntity, PendingFichajeWithUser } from '../../domain/entities/fichaje.entity';

export interface FichajePort {
  getByUser(userId: string): Observable<FichajeEntity[]>;
  getPendingByManager(managerId: string): Observable<PendingFichajeWithUser[]>;
  create(fichaje: Omit<FichajeEntity, 'id'>): Observable<FichajeEntity>;
  approve(id: string, managerId: string, comment?: string): Observable<FichajeEntity>;
  reject(id: string, managerId: string, reason: string): Observable<FichajeEntity>;
}

export const FICHAJE_PORT_TOKEN = new InjectionToken<FichajePort>('FichajePort');
