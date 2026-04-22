export type IncidenciaType = 'missing-checkin' | 'pending-approval';

export interface IncidenciaEntity {
  id: string;
  userId: string;
  fullName: string;
  type: IncidenciaType;
  dateIso: string;
}
