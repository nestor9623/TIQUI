import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type UiTableCellValue = string | number | null | undefined;

export interface UiTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'tiqui-ui-table',
  imports: [],
  templateUrl: './ui-table.html',
  styleUrl: './ui-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTableComponent {
  columns = input.required<UiTableColumn[]>();
  rows = input.required<Array<Record<string, UiTableCellValue>>>();
  emptyMessage = input<string>('No hay datos para mostrar.');
}
