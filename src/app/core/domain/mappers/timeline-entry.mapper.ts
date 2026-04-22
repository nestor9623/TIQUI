import { DbEventType, EntryType, HistoryEntry } from '../models/timeline-entry.model';

export class TimelineEntryMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toDomain(row: any): HistoryEntry {
    const ts: string = row.timestamp ?? '';
    const time = ts.length >= 16 ? ts.substring(11, 16) : ts;
    const eventType: DbEventType = row.event_type;
    return {
      time,
      type: TimelineEntryMapper.toEntryType(eventType),
      label: row.description || TimelineEntryMapper.toEntryType(eventType),
    };
  }

  /** Second pass: turns an 'Entrada' that follows a 'Pausa' into 'Reanudar'. */
  static resolveTypes(entries: HistoryEntry[]): HistoryEntry[] {
    let lastWasPause = false;
    let firstIn = true;
    return entries.map(entry => {
      if (entry.type === 'Pausa') {
        lastWasPause = true;
        return entry;
      }
      if (entry.type === 'Entrada') {
        if (!firstIn && lastWasPause) {
          lastWasPause = false;
          return { ...entry, type: 'Reanudar' as EntryType, label: entry.label === 'Entrada' ? 'Reanudar' : entry.label };
        }
        firstIn = false;
        lastWasPause = false;
        return entry;
      }
      lastWasPause = false;
      return entry;
    });
  }

  static toDbEventType(entryType: EntryType): DbEventType {
    if (entryType === 'Entrada') return 'in';
    if (entryType === 'Reanudar') return 'in';
    if (entryType === 'Salida') return 'out';
    return 'pause';
  }

  static toEntryType(dbType: DbEventType): EntryType {
    if (dbType === 'in') return 'Entrada';
    if (dbType === 'out') return 'Salida';
    return 'Pausa';
  }
}
