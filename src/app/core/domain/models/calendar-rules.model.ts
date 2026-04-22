export interface CalendarRules {
  defaultDailyHoursTarget: number;
  communities: Record<string, { holidays: string[] }>;
  managerWeekendOverrides: Array<{ userId: string; date_iso: string; reason: string }>;
}
