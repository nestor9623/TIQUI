export type EntryType = 'Entrada' | 'Salida' | 'Pausa' | 'Reanudar';
export type DbEventType = 'in' | 'out' | 'pause';

export interface HistoryEntry {
  time: string;
  type: EntryType;
  label: string;
}
