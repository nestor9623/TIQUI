import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogItemEntity } from '../../../domain/entities/catalog-item.entity';
import { CATALOG_ITEM_PORT_TOKEN } from '../../ports/catalog-item.port';

@Injectable({ providedIn: 'root' })
export class GetAllCatalogItemsUseCase {
  private readonly port = inject(CATALOG_ITEM_PORT_TOKEN);

  execute(): Observable<CatalogItemEntity[]> {
    return this.port.getAll();
  }
}
