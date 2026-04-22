import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { CatalogItemEntity, CatalogType } from '../../../domain/entities/catalog-item.entity';
import { CatalogItemDraft, CatalogItemPort } from '../../../application/ports/catalog-item.port';
import { CatalogItemMapper } from './catalog-item.mapper';

@Injectable({ providedIn: 'root' })
export class SupabaseCatalogRepository implements CatalogItemPort {
  private readonly supabase = inject(SupabaseClientService).client;

  getAll(): Observable<CatalogItemEntity[]> {
    return from(
      this.supabase
        .from('catalog_items')
        .select('*')
        .order('type')
        .order('name')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(CatalogItemMapper.toDomain);
      })
    );
  }

  getByType(type: CatalogType): Observable<CatalogItemEntity[]> {
    return from(
      this.supabase
        .from('catalog_items')
        .select('*')
        .eq('type', type)
        .order('name')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(CatalogItemMapper.toDomain);
      })
    );
  }

  create(item: CatalogItemDraft): Observable<CatalogItemEntity> {
    return from(
      this.supabase
        .from('catalog_items')
        .insert(CatalogItemMapper.toInsert(item))
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return CatalogItemMapper.toDomain(data);
      })
    );
  }

  update(id: string, patch: Partial<CatalogItemDraft>): Observable<CatalogItemEntity> {
    return from(
      this.supabase
        .from('catalog_items')
        .update(CatalogItemMapper.toInsert(patch))
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return CatalogItemMapper.toDomain(data);
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.from('catalog_items').delete().eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
