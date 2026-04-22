import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogItemEntity, CatalogType } from '../../domain/entities/catalog-item.entity';
import { CatalogItemDraft } from '../ports/catalog-item.port';
import { GetAllCatalogItemsUseCase } from '../use-cases/catalog/get-all-catalog-items.usecase';
import { GetCatalogItemsByTypeUseCase } from '../use-cases/catalog/get-catalog-items-by-type.usecase';
import { CreateCatalogItemUseCase } from '../use-cases/catalog/create-catalog-item.usecase';
import { UpdateCatalogItemUseCase } from '../use-cases/catalog/update-catalog-item.usecase';
import { DeleteCatalogItemUseCase } from '../use-cases/catalog/delete-catalog-item.usecase';

@Injectable({ providedIn: 'root' })
export class CatalogFacade {
  private readonly getAllUC = inject(GetAllCatalogItemsUseCase);
  private readonly getByTypeUC = inject(GetCatalogItemsByTypeUseCase);
  private readonly createUC = inject(CreateCatalogItemUseCase);
  private readonly updateUC = inject(UpdateCatalogItemUseCase);
  private readonly deleteUC = inject(DeleteCatalogItemUseCase);

  getAll(): Observable<CatalogItemEntity[]> {
    return this.getAllUC.execute();
  }

  getByType(type: CatalogType): Observable<CatalogItemEntity[]> {
    return this.getByTypeUC.execute(type);
  }

  create(item: CatalogItemDraft): Observable<CatalogItemEntity> {
    return this.createUC.execute(item);
  }

  update(id: string, patch: Partial<CatalogItemDraft>): Observable<CatalogItemEntity> {
    return this.updateUC.execute(id, patch);
  }

  delete(id: string): Observable<void> {
    return this.deleteUC.execute(id);
  }
}
