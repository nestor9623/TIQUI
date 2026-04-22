import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileEntity } from '../../domain/entities/profile.entity';

export interface ProfilesPort {
  getAll(): Observable<ProfileEntity[]>;
  getByManager(managerId: string): Observable<ProfileEntity[]>;
  update(id: string, data: Partial<ProfileEntity>): Observable<ProfileEntity>;
}

export const PROFILES_PORT_TOKEN = new InjectionToken<ProfilesPort>('ProfilesPort');
