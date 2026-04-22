export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const clone = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  clone.setDate(clone.getDate() + days);
  return clone;
}

export function startOfWeekMonday(date: Date): Date {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = normalized.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(normalized, mondayOffset);
}

