import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileEntity } from '../../domain/entities/profile.entity';
import { GetProfilesUseCase } from '../use-cases/profiles/get-profiles.usecase';
import { GetProfilesByManagerUseCase } from '../use-cases/profiles/get-profiles-by-manager.usecase';
import { UpdateProfileUseCase } from '../use-cases/profiles/update-profile.usecase';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly getProfilesUC = inject(GetProfilesUseCase);
  private readonly getByManagerUC = inject(GetProfilesByManagerUseCase);
  private readonly updateUC = inject(UpdateProfileUseCase);

  getAll(): Observable<ProfileEntity[]> {
    return this.getProfilesUC.execute();
  }

  getByManager(managerId: string): Observable<ProfileEntity[]> {
    return this.getByManagerUC.execute(managerId);
  }

  update(id: string, data: Partial<ProfileEntity>): Observable<ProfileEntity> {
    return this.updateUC.execute(id, data);
  }
}
