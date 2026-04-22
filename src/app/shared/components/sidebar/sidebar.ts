import { Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarSection, NavItem } from '../../models/navigation.model';

const SIDEBAR_SECTIONS_KEY = 'tiqui.sidebar.sections';

@Component({
  selector: 'tiqui-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  // Input para recibir las secciones del sidebar
  sections = input<SidebarSection[]>([]);

  // Input para controlar si está abierto en mobile
  mobileOpen = input<boolean>(false);
  collapsed = input<boolean>(false);

  // Signal para controlar secciones plegables
  private readonly sectionOpenState = signal<Record<string, boolean>>(this.readSectionState());

  // salida de estado para que el layout pueda adaptarse
  collapsedChange = output<boolean>();

  // salida para cerrar en mobile
  closeMobile = output<void>();

  constructor() {
    effect(() => {
      const current = this.sections();
      const next = { ...this.sectionOpenState() };
      let changed = false;

      for (const section of current) {
        if (next[section.title] === undefined) {
          next[section.title] = section.expanded ?? true;
          changed = true;
        }
      }

      if (changed) {
        this.sectionOpenState.set(next);
        this.persistSections(next);
      }
    });
  }

  // Toggle para colapsar/expandir el sidebar
  toggleSidebar(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  // Filtrar items visibles
  getVisibleItems(items: NavItem[]): NavItem[] {
    return items.filter(item => item.visible !== false);
  }

  isSectionOpen(section: SidebarSection): boolean {
    if (this.collapsed()) {
      return true;
    }
    return this.sectionOpenState()[section.title] ?? true;
  }

  toggleSection(section: SidebarSection): void {
    if (this.collapsed()) {
      return;
    }

    this.sectionOpenState.update(state => {
      const next = {
        ...state,
        [section.title]: !(state[section.title] ?? true),
      };
      this.persistSections(next);
      return next;
    });
  }

  private persistSections(state: Record<string, boolean>): void {
    localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(state));
  }

  private readSectionState(): Record<string, boolean> {
    const raw = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return {};
      }
      return parsed as Record<string, boolean>;
    } catch {
      return {};
    }
  }
}
