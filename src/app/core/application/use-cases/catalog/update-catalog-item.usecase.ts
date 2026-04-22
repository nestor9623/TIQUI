import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogItemEntity } from '../../../domain/entities/catalog-item.entity';
import { CATALOG_ITEM_PORT_TOKEN, CatalogItemDraft } from '../../ports/catalog-item.port';

@Injectable({ providedIn: 'root' })
export class UpdateCatalogItemUseCase {
  private readonly port = inject(CATALOG_ITEM_PORT_TOKEN);

  execute(id: string, patch: Partial<CatalogItemDraft>): Observable<CatalogItemEntity> {
    return this.port.update(id, patch);
  }
}
