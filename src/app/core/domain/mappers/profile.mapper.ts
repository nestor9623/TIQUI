import { UserRole } from '../../auth/models/auth.model';
import { ProfileEntity } from '../entities/profile.entity';

export class ProfileMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toDomain(row: any): ProfileEntity {
    return {
      id: row.id,
      email: row.email ?? '',
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      role: (row.role as UserRole) ?? UserRole.EMPLOYEE,
      isTeamLeader: Boolean(row.is_team_leader),
      active: row.active ?? true,
      address: row.address ?? null,
      area: row.area ?? null,
      community: row.community ?? null,
      weeklyHoursTarget: row.weekly_hours_target ?? 40,
      managerId: row.manager_id ?? null,
      vacationDates: row.vacation_dates ?? [],
      avatar: row.avatar ?? null,
      createdAt: row.created_at ?? '',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toInsert(entity: Partial<ProfileEntity>): any {
    return {
      ...(entity.email !== undefined && { email: entity.email }),
      ...(entity.firstName !== undefined && { first_name: entity.firstName }),
      ...(entity.lastName !== undefined && { last_name: entity.lastName }),
      ...(entity.role !== undefined && { role: entity.role }),
      ...(entity.isTeamLeader !== undefined && { is_team_leader: entity.isTeamLeader }),
      ...(entity.active !== undefined && { active: entity.active }),
      ...(entity.address !== undefined && { address: entity.address }),
      ...(entity.area !== undefined && { area: entity.area }),
      ...(entity.community !== undefined && { community: entity.community }),
      ...(entity.weeklyHoursTarget !== undefined && { weekly_hours_target: entity.weeklyHoursTarget }),
      ...(entity.managerId !== undefined && { manager_id: entity.managerId }),
      ...(entity.vacationDates !== undefined && { vacation_dates: entity.vacationDates }),
    };
  }
}
