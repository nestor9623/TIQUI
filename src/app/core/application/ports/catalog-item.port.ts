import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogItemEntity, CatalogType } from '../../domain/entities/catalog-item.entity';

export type CatalogItemDraft = Omit<CatalogItemEntity, 'id' | 'createdAt'>;

export interface CatalogItemPort {
  getAll(): Observable<CatalogItemEntity[]>;
  getByType(type: CatalogType): Observable<CatalogItemEntity[]>;
  create(item: CatalogItemDraft): Observable<CatalogItemEntity>;
  update(id: string, patch: Partial<CatalogItemDraft>): Observable<CatalogItemEntity>;
  delete(id: string): Observable<void>;
}

export const CATALOG_ITEM_PORT_TOKEN = new InjectionToken<CatalogItemPort>('CatalogItemPort');
