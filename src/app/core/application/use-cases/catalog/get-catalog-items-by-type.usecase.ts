import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogItemEntity, CatalogType } from '../../../domain/entities/catalog-item.entity';
import { CATALOG_ITEM_PORT_TOKEN } from '../../ports/catalog-item.port';

@Injectable({ providedIn: 'root' })
export class GetCatalogItemsByTypeUseCase {
  private readonly port = inject(CATALOG_ITEM_PORT_TOKEN);

  execute(type: CatalogType): Observable<CatalogItemEntity[]> {
    return this.port.getByType(type);
  }
}
