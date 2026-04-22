import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CATALOG_ITEM_PORT_TOKEN } from '../../ports/catalog-item.port';

@Injectable({ providedIn: 'root' })
export class DeleteCatalogItemUseCase {
  private readonly port = inject(CATALOG_ITEM_PORT_TOKEN);

  execute(id: string): Observable<void> {
    return this.port.delete(id);
  }
}
