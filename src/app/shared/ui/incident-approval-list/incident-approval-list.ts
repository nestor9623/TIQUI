import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { UiButtonComponent } from '../button/ui-button';
import { UiConfirmDialogComponent } from '../confirm-dialog/ui-confirm-dialog';

export interface IncidentApprovalItem {
  id: string;
  userId: string;
  fullName: string;
  type: 'missing-checkin' | 'pending-approval';
  dateIso: string;
}

@Component({
  selector: 'tiqui-incident-approval-list',
  imports: [CommonModule, UiButtonComponent, UiConfirmDialogComponent],
  templateUrl: './incident-approval-list.html',
  styleUrl: './incident-approval-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentApprovalListComponent {
  private readonly i18n = inject(I18nStore);

  readonly items = input<IncidentApprovalItem[]>([]);
  readonly emptyMessageKey = input('incidentApproval.emptyOpen');

  readonly approved = output<{ ids: string[]; comment: string }>();

  private readonly selectedIds = signal<string[]>([]);
  private readonly pendingApprovalIds = signal<string[]>([]);

  readonly texts = computed(() => this.i18n.translations().incidentApproval);
  readonly selectedCount = computed(() => this.selectedIds().length);
  readonly resolvedEmptyMessage = computed(() => this.i18n.t(this.emptyMessageKey()));
  readonly selectedCountLabel = computed(() => {
    const count = this.selectedCount();
    const template = count === 1 ? this.texts().selectedCountSingular : this.texts().selectedCountPlural;
    return this.interpolate(template, { count });
  });
  readonly confirmOpen = computed(() => this.pendingApprovalIds().length > 0);
  readonly confirmTitle = computed(() => this.pendingApprovalIds().length > 1
    ? this.interpolate(this.texts().titleMultiple, { count: this.pendingApprovalIds().length })
    : this.texts().titleSingle);
  readonly confirmMessage = computed(() => this.pendingApprovalIds().length > 1
    ? this.texts().messageMultiple
    : this.texts().messageSingle);
  readonly confirmDetails = computed(() => {
    const selected = new Set(this.pendingApprovalIds());
    return this.items()
      .filter(item => selected.has(item.id))
      .map(item => `${item.fullName} · ${this.typeLabel(item.type)} · ${item.dateIso}`);
  });

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleAllSelections(): void {
    if (this.selectedIds().length === this.items().length) {
      this.selectedIds.set([]);
      return;
    }

    this.selectedIds.set(this.items().map(item => item.id));
  }

  toggleSelection(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update(ids => {
      if (checked) {
        return ids.includes(id) ? ids : [...ids, id];
      }
      return ids.filter(current => current !== id);
    });
  }

  requestApproveOne(id: string): void {
    this.pendingApprovalIds.set([id]);
  }

  requestApproveSelected(): void {
    if (this.selectedIds().length === 0) {
      return;
    }
    this.pendingApprovalIds.set([...this.selectedIds()]);
  }

  closeDialog(): void {
    this.pendingApprovalIds.set([]);
  }

  confirmApproval(event: { comment: string }): void {
    const ids = this.pendingApprovalIds();
    if (ids.length === 0) {
      return;
    }

    this.approved.emit({
      ids,
      comment: event.comment.trim(),
    });

    this.selectedIds.update(current => current.filter(id => !ids.includes(id)));
    this.closeDialog();
  }

  typeLabel(type: 'missing-checkin' | 'pending-approval'): string {
    return type === 'missing-checkin' ? this.texts().typeMissingCheckin : this.texts().typePendingApproval;
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}
