import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { CatalogFacade } from '../../../../core/application/services/catalog.facade';
import { AppAlertService } from '../../../../shared/services/app-alert.service';
import { CatalogItemEntity, CatalogType } from '../../../../core/domain/entities/catalog-item.entity';
import { CatalogItemDraft } from '../../../../core/application/ports/catalog-item.port';

interface CatalogState {
  items: CatalogItemEntity[];
  activeTab: CatalogType;
  loading: boolean;
  saving: boolean;
  editingId: string | null;
}

const initialState: CatalogState = {
  items: [],
  activeTab: 'community',
  loading: false,
  saving: false,
  editingId: null,
};

export const CatalogStore = signalStore(
  withState(initialState),

  withComputed(({ items, editingId }) => ({
    editingItem: computed(() =>
      editingId() ? items().find(i => i.id === editingId()) ?? null : null,
    ),
  })),

  withMethods((store, facade = inject(CatalogFacade), alerts = inject(AppAlertService)) => ({

    setTab(tab: CatalogType): void {
      patchState(store, { activeTab: tab, editingId: null });
    },

    startEdit(item: CatalogItemEntity): void {
      patchState(store, { editingId: item.id });
    },

    cancelEdit(): void {
      patchState(store, { editingId: null });
    },

    loadItems: rxMethod<CatalogType>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(type =>
          facade.getByType(type).pipe(
            tap(items => patchState(store, { items, loading: false })),
            catchError(() => {
              alerts.danger('Error', 'Error al cargar los catálogos');
              patchState(store, { loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    saveItem: rxMethod<{ draft: CatalogItemDraft; id: string | null }>(
      pipe(
        tap(() => patchState(store, { saving: true })),
        switchMap(({ draft, id }) => {
          const op$ = id ? facade.update(id, draft) : facade.create(draft);
          return op$.pipe(
            switchMap(() => {
              alerts.success('Catálogos', id ? 'Ítem actualizado' : 'Ítem creado');
              patchState(store, { saving: false, editingId: null });
              return facade.getByType(store.activeTab()).pipe(
                tap(items => patchState(store, { items })),
              );
            }),
            catchError((err: any) => {
              alerts.danger('Error', err?.message ?? 'Error al guardar');
              patchState(store, { saving: false });
              return EMPTY;
            }),
          );
        }),
      ),
    ),

    deleteItem: rxMethod<CatalogItemEntity>(
      pipe(
        switchMap(item =>
          facade.delete(item.id).pipe(
            tap(() => {
              alerts.success('Catálogos', 'Ítem eliminado');
              patchState(store, { items: store.items().filter(i => i.id !== item.id) });
            }),
            catchError((err: any) => {
              alerts.danger('Error', err?.message ?? 'Error al eliminar');
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
