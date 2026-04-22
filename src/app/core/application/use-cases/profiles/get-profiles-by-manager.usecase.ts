import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileEntity } from '../../../domain/entities/profile.entity';
import { PROFILES_PORT_TOKEN } from '../../ports/profiles.port';

@Injectable({ providedIn: 'root' })
export class GetProfilesByManagerUseCase {
  private readonly port = inject(PROFILES_PORT_TOKEN);

  execute(managerId: string): Observable<ProfileEntity[]> {
    return this.port.getByManager(managerId);
  }
}
