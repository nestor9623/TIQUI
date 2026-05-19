export type UserRole = 'admin' | 'manager' | 'employee' | 'generic';
export type Community = 'madrid' | 'galicia';
export type VacationRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
/** Extendido dinámicamente por vacation_type_catalog; los valores iniciales se mantienen para compatibilidad */
export type VacationTypeCode = 'current-year' | 'previous-year' | 'legal' | 'personal' | 'legal-relocation' | 'legal-family' | 'legal-exam' | (string & {});
export type DayStatus =
  | 'not-clocked'
  | 'clocked-in'
  | 'on-pause'
  | 'clocked-out'
  | 'holiday'
  | 'weekend'
  | 'vacation';
export type FichajeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventType = 'in' | 'out' | 'pause';

export interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_team_leader: boolean;
  active: boolean;
  address: string | null;
  area: string | null;
  community: Community | null;
  weekly_hours_target: number | null;
  manager_id: string | null;
  vacation_dates: string[] | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_team_leader?: boolean;
  active?: boolean;
  address?: string | null;
  area?: string | null;
  community?: Community | null;
  weekly_hours_target?: number | null;
  manager_id?: string | null;
  vacation_dates?: string[] | null;
  avatar?: string | null;
}

export interface DailyReportRow {
  id: string;
  user_id: string;
  date_iso: string;
  day_status: DayStatus;
  worked_hours: string;
  total_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface DailyReportInsert {
  id?: string;
  user_id: string;
  date_iso: string;
  day_status?: DayStatus;
  worked_hours?: string;
  total_minutes?: number;
}

export interface TimelineEventRow {
  id: string;
  report_id: string;
  user_id: string;
  timestamp: string;
  event_type: EventType;
  description: string;
  created_at: string;
}

export interface TimelineEventInsert {
  id?: string;
  report_id: string;
  user_id: string;
  timestamp: string;
  event_type: EventType;
  description?: string;
}

export interface FichajeRow {
  id: string;
  user_id: string;
  date_iso: string;
  hours: string;
  description: string;
  status: FichajeStatus;
  submitted_by: string;
  submitted_at: string;
  manager_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface FichajeInsert {
  id?: string;
  user_id: string;
  date_iso: string;
  hours: string;
  description?: string;
  status?: FichajeStatus;
  submitted_by: string;
  submitted_at?: string;
  manager_id?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  manager_comment?: string | null;
}

export interface IncidenciaRow {
  id: string;
  user_id: string;
  manager_id: string | null;
  type: string;
  description: string;
  status: FichajeStatus;
  date_iso: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidenciaInsert {
  id?: string;
  user_id: string;
  manager_id?: string | null;
  type: string;
  description?: string;
  status?: FichajeStatus;
  date_iso: string;
  note?: string | null;
}

export interface VacationRequestRow {
  id: string;
  user_id: string;
  manager_id: string | null;
  vacation_type: VacationTypeCode;
  start_date: string;
  end_date: string;
  days_count: number;
  notes: string | null;
  status: VacationRequestStatus;
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface VacationRequestInsert {
  id?: string;
  user_id: string;
  manager_id?: string | null;
  vacation_type: VacationTypeCode;
  start_date: string;
  end_date: string;
  days_count: number;
  notes?: string | null;
  status?: VacationRequestStatus;
  manager_comment?: string | null;
}

export interface VacationTypeCatalogRow {
  id: string;
  code: string;
  label: string;
  days_per_year: number;
  description: string | null;
  is_annual: boolean;
  expires_month: number | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface HolidayRow {
  id: string;
  date: string;
  name: string;
  scope: 'national' | 'community';
  community: string | null;
  year: number;
  created_at: string;
}

export interface VacationYearBalanceRow {
  id: string;
  user_id: string;
  year: number;
  type_code: string;
  total_days: number;
  created_at: string;
  updated_at: string;
}

export interface VacationYearBalanceInsert {
  id?: string;
  user_id: string;
  year: number;
  type_code: string;
  total_days: number;
}

/** Resultado de get_vacation_balances_for_user() */
export interface VacationBalanceRpcRow {
  code: string;
  label: string;
  total_days: number;
  used_days: number;
  available_days: number;
  expires_month: number | null;
  is_annual: boolean;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      daily_reports: {
        Row: DailyReportRow;
        Insert: DailyReportInsert;
        Update: Partial<DailyReportInsert>;
        Relationships: [];
      };
      timeline_events: {
        Row: TimelineEventRow;
        Insert: TimelineEventInsert;
        Update: Partial<TimelineEventInsert>;
        Relationships: [];
      };
      fichajes: {
        Row: FichajeRow;
        Insert: FichajeInsert;
        Update: Partial<FichajeInsert>;
        Relationships: [];
      };
      incidencias: {
        Row: IncidenciaRow;
        Insert: IncidenciaInsert;
        Update: Partial<IncidenciaInsert>;
        Relationships: [];
      };
      vacation_requests: {
        Row: VacationRequestRow;
        Insert: VacationRequestInsert;
        Update: Partial<VacationRequestInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
