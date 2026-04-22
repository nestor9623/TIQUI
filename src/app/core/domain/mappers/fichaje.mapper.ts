import { FichajeEntity, PendingFichajeWithUser } from '../entities/fichaje.entity';

export class FichajeMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toDomain(row: any): FichajeEntity {
    return {
      id: row.id,
      userId: row.user_id,
      date_iso: row.date_iso,
      hours: row.hours,
      description: row.description,
      status: row.status,
      submittedBy: row.submitted_by,
      submittedAt: row.submitted_at,
      managerId: row.manager_id ?? undefined,
      approvedAt: row.approved_at ?? undefined,
      rejectionReason: row.rejection_reason ?? undefined,
      managerComment: row.manager_comment ?? undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toDomainWithUser(row: any): PendingFichajeWithUser {
    const profile = row.profiles;
    const firstName: string = profile?.first_name ?? '';
    const lastName: string = profile?.last_name ?? '';
    const employeeName = `${firstName} ${lastName}`.trim() || 'Usuario desconocido';
    return {
      ...FichajeMapper.toDomain(row),
      status: 'PENDING',
      employeeName,
    };
  }
}
