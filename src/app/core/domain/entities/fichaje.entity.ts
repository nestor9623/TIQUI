/**
 * Entidad de dominio Fichaje (para flujo aprobación)
 */
export interface FichajeEntity {
  id: string;
  userId: string;
  date_iso: string;
  hours: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy: string;
  submittedAt: string;
  managerId?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PendingFichaje extends FichajeEntity {
  status: 'PENDING';
}
