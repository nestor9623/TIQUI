import { UserRole } from '../../auth/models/auth.model';

export type ProfileCommunity = 'madrid' | 'galicia';

export interface ProfileEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isTeamLeader: boolean;
  active: boolean;
  address: string | null;
  area: string | null;
  community: ProfileCommunity | null;
  weeklyHoursTarget: number;
  managerId: string | null;
  vacationDates: string[];
  avatar: string | null;
  createdAt: string;
}
