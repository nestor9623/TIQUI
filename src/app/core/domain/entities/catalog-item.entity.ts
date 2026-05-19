export type CatalogType =
  | 'community'
  | 'area'
  | 'user_type'
  | 'profile'
  | 'vacation_type'
  | 'generic_combo';

export interface CatalogItemEntity {
  id: string;
  type: CatalogType;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}
