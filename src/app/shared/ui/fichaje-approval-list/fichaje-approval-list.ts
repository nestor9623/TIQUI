import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { PendingFichajeWithUser } from '../../../core/domain/entities/fichaje.entity';
import { UiButtonComponent } from '../button/ui-button';
import { UiConfirmDialogComponent } from '../confirm-dialog/ui-confirm-dialog';

interface PendingAction {
  id: string;
  kind: 'approve' | 'reject';
}

@Component({
  selector: 'tiqui-fichaje-approval-list',
  imports: [CommonModule, UiButtonComponent, UiConfirmDialogComponent],
  templateUrl: './fichaje-approval-list.html',
  styleUrl: './fichaje-approval-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichajeApprovalListComponent {
  readonly items = input<PendingFichajeWithUser[]>([]);

  readonly fichajeApproved = output<{ id: string; comment: string }>();
  readonly fichajeRejected = output<{ id: string; reason: string }>();

  readonly pendingAction = signal<PendingAction | null>(null);

  readonly approveDialogOpen = computed(() => this.pendingAction()?.kind === 'approve');
  readonly rejectDialogOpen = computed(() => this.pendingAction()?.kind === 'reject');

  readonly dialogDetails = computed(() => {
    const action = this.pendingAction();
    if (!action) return [];
    const item = this.items().find(f => f.id === action.id);
    if (!item) return [];
    return [`${item.employeeName} · ${item.date_iso} · ${item.hours}`];
  });

  requestApprove(id: string): void {
    this.pendingAction.set({ id, kind: 'approve' });
  }

  requestReject(id: string): void {
    this.pendingAction.set({ id, kind: 'reject' });
  }

  closeDialog(): void {
    this.pendingAction.set(null);
  }

  confirmApprove(event: { comment: string }): void {
    const id = this.pendingAction()?.id;
    if (!id) return;
    this.fichajeApproved.emit({ id, comment: event.comment.trim() });
    this.pendingAction.set(null);
  }

  confirmReject(event: { comment: string }): void {
    const id = this.pendingAction()?.id;
    if (!id) return;
    this.fichajeRejected.emit({ id, reason: event.comment.trim() });
    this.pendingAction.set(null);
  }
}
