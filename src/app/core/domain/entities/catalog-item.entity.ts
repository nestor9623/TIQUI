export type CatalogType = 'community' | 'area';

export interface CatalogItemEntity {
  id: string;
  type: CatalogType;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}
