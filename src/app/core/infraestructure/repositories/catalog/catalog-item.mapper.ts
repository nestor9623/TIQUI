import { CatalogItemEntity, CatalogType } from '../../../domain/entities/catalog-item.entity';

interface RawCatalogItem {
  id: string;
  type: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
}

export class CatalogItemMapper {
  static toDomain(raw: RawCatalogItem): CatalogItemEntity {
    return {
      id: raw.id,
      type: raw.type as CatalogType,
      code: raw.code,
      name: raw.name,
      active: raw.active,
      createdAt: raw.created_at,
    };
  }

  static toInsert(draft: Partial<Omit<CatalogItemEntity, 'id' | 'createdAt'>>): Partial<RawCatalogItem> {
    const record: Partial<RawCatalogItem> = {};
    if (draft.type !== undefined) record.type = draft.type;
    if (draft.code !== undefined) record.code = draft.code;
    if (draft.name !== undefined) record.name = draft.name;
    if (draft.active !== undefined) record.active = draft.active;
    return record;
  }
}
