import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileEntity } from '../../../domain/entities/profile.entity';
import { PROFILES_PORT_TOKEN } from '../../ports/profiles.port';

@Injectable({ providedIn: 'root' })
export class UpdateProfileUseCase {
  private readonly port = inject(PROFILES_PORT_TOKEN);

  execute(id: string, data: Partial<ProfileEntity>): Observable<ProfileEntity> {
    return this.port.update(id, data);
  }
}
