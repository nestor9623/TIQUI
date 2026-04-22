import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { UiButtonComponent } from '../button/ui-button';

@Component({
  selector: 'tiqui-ui-confirm-dialog',
  imports: [CommonModule, UiButtonComponent],
  template: `
    @if (open()) {
      <div class="ui-confirm-dialog__backdrop" (click)="onCancel()"></div>

      <div class="ui-confirm-dialog__shell" (click)="onCancel()">
        <section class="ui-confirm-dialog" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="ui-confirm-dialog__header">
            <h3>{{ title() }}</h3>
            @if (message()) {
              <p>{{ message() }}</p>
            }
          </div>

          @if (details().length > 0) {
            <ul class="ui-confirm-dialog__details">
              @for (detail of details(); track detail) {
                <li>{{ detail }}</li>
              }
            </ul>
          }

          @if (showComment()) {
            <label class="ui-confirm-dialog__field">
              <span>{{ commentLabel() }}</span>
              <textarea
                rows="4"
                [value]="comment()"
                [placeholder]="commentPlaceholder()"
                (input)="onCommentInput($event)"></textarea>
            </label>
          }

          <div class="ui-confirm-dialog__actions">
            <tiqui-ui-button variant="ghost" (pressed)="onCancel()">
              {{ cancelLabel() }}
            </tiqui-ui-button>
            <tiqui-ui-button [variant]="confirmVariant()" (pressed)="onConfirm()">
              {{ confirmLabel() }}
            </tiqui-ui-button>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    .ui-confirm-dialog__backdrop,
    .ui-confirm-dialog__shell {
      position: fixed;
      inset: 0;
    }

    .ui-confirm-dialog__backdrop {
      background: rgba(2, 6, 23, 0.62);
      z-index: 60;
    }

    .ui-confirm-dialog__shell {
      display: grid;
      place-items: center;
      padding: 1rem;
      z-index: 61;
    }

    .ui-confirm-dialog {
      width: min(420px, 100%);
      padding: 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 18px;
      background: var(--surface-card);
      box-shadow: var(--elevation-3);
    }

    .ui-confirm-dialog__header h3,
    .ui-confirm-dialog__header p {
      margin: 0;
    }

    .ui-confirm-dialog__header p {
      margin-top: 0.45rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .ui-confirm-dialog__details {
      margin: 0.9rem 0 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.32rem;
      color: var(--text-muted);
      font-size: 0.84rem;
    }

    .ui-confirm-dialog__field {
      display: grid;
      gap: 0.4rem;
      margin-top: 0.95rem;
    }

    .ui-confirm-dialog__field span {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .ui-confirm-dialog__field textarea {
      width: 100%;
      box-sizing: border-box;
      resize: vertical;
      min-height: 96px;
      padding: 0.75rem 0.85rem;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--surface-border) 88%, transparent);
      background: color-mix(in srgb, var(--surface-app) 45%, var(--surface-card));
      color: var(--text-primary);
      font: inherit;
    }

    .ui-confirm-dialog__field textarea:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--brand-primary) 38%, transparent);
      outline-offset: 1px;
    }

    .ui-confirm-dialog__actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;
    }

    @media (max-width: 640px) {
      .ui-confirm-dialog__actions {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiConfirmDialogComponent {
  open = input(false);
  title = input('Confirmar acción');
  message = input('¿Seguro que quieres continuar?');
  details = input<string[]>([]);
  confirmLabel = input('Confirmar');
  cancelLabel = input('Cancelar');
  tone = input<'primary' | 'danger'>('primary');
  showComment = input(false);
  commentLabel = input('Comentario');
  commentPlaceholder = input('Añade un comentario opcional');

  cancelled = output<void>();
  confirmed = output<{ comment: string }>();

  readonly confirmVariant = computed(() => this.tone() === 'danger' ? 'danger' : 'primary');
  readonly comment = signal('');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.comment.set('');
      }
    });
  }

  onCancel(): void {
    this.comment.set('');
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.confirmed.emit({ comment: this.comment() });
    this.comment.set('');
  }

  onCommentInput(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }
}
