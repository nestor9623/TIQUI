export type IncidenciaType = 'missing-checkin' | 'pending-approval' | 'vacation-pending';

export interface IncidenciaEntity {
  id: string;
  userId: string;
  fullName: string;
  type: IncidenciaType;
  dateIso: string;
}
