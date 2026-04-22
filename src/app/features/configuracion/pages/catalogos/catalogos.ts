import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CatalogItemEntity, CatalogType } from '../../../../core/domain/entities/catalog-item.entity';
import { CatalogStore } from './catalog.store';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  providers: [CatalogStore],
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalogos.html',
  styleUrl: './catalogos.scss',
})
export class CatalogosPage {
  readonly store = inject(CatalogStore);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    active: [true],
  });

  constructor() {
    this.store.loadItems(this.store.activeTab);

    // Sync form when editing item changes
    effect(() => {
      const item = this.store.editingItem();
      if (item) {
        this.form.patchValue({ code: item.code, name: item.name, active: item.active });
      } else {
        this.form.reset({ active: true });
      }
    });
  }

  setTab(tab: CatalogType): void {
    this.store.setTab(tab);
    this.store.loadItems(tab);
  }

  startEdit(item: CatalogItemEntity): void {
    this.store.startEdit(item);
  }

  cancelEdit(): void {
    this.store.cancelEdit();
  }

  save(): void {
    if (this.form.invalid) return;
    const { code, name, active } = this.form.getRawValue();
    const draft = { type: this.store.activeTab(), code: code!, name: name!, active: active ?? true };
    this.store.saveItem({ draft, id: this.store.editingId() });
  }

  deleteItem(item: CatalogItemEntity): void {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return;
    this.store.deleteItem(item);
  }
}
