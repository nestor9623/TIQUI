import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileEntity } from '../../../domain/entities/profile.entity';
import { PROFILES_PORT_TOKEN } from '../../ports/profiles.port';

@Injectable({ providedIn: 'root' })
export class GetProfilesUseCase {
  private readonly port = inject(PROFILES_PORT_TOKEN);

  execute(): Observable<ProfileEntity[]> {
    return this.port.getAll();
  }
}
