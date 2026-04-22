import { CommonModule } from '@angular/common';
import { Component, ElementRef, effect, inject, input, output } from '@angular/core';

@Component({
  selector: 'tiqui-ui-dropdown',
  imports: [CommonModule],
  templateUrl: './ui-dropdown.html',
  styleUrl: './ui-dropdown.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()'
  },
})
export class UiDropdownComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  open = input(false);
  closeOnOutside = input(true);

  toggleRequested = output<void>();
  closeRequested = output<void>();

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      queueMicrotask(() => {
        this.focusFirstItem();
      });
    });
  }

  onDocumentClick(event: Event): void {
    if (!this.closeOnOutside() || !this.open()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    const host = this.elementRef.nativeElement;
    if (!host.contains(target)) {
      this.closeRequested.emit();
    }
  }

  onEscapeKey(): void {
    if (!this.open()) {
      return;
    }

    this.closeRequested.emit();
  }

  private focusFirstItem(): void {
    const host = this.elementRef.nativeElement;
    const panel = host.querySelector('.ui-dropdown__panel');
    if (!(panel instanceof HTMLElement)) {
      return;
    }

    const focusable = panel.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    focusable?.focus();
  }
}
