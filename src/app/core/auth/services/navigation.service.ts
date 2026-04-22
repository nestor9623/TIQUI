import { Injectable } from '@angular/core';
import { SidebarSection } from '../../../shared/models/navigation.model';
import { UserRole } from '../../../core/auth/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  /**
   * Genera las secciones del sidebar según el rol del usuario
   */
  getNavigationByRole(role: UserRole): SidebarSection[] {
    switch (role) {
      case UserRole.ADMIN:
        return this.getAdminNavigation();
      case UserRole.MANAGER:
        return this.getManagerNavigation();
      case UserRole.EMPLOYEE:
        return this.getEmployeeNavigation();
      default:
        return [];
    }
  }

  /**
   * Navegación para Administradores
   */
  private getAdminNavigation(): SidebarSection[] {
    return [
      {
        title: 'Sistema',
        expanded: true,
        items: [
          {
            label: 'Dashboard Admin',
            icon: '📊',
            route: '/admin-dashboard',
            visible: true,
          },
          {
            label: 'Usuarios',
            icon: '👥',
            route: '/usuarios',
            visible: true,
          },
          {
            label: 'Configuración',
            icon: '⚙️',
            route: '/home',
            visible: true,
          },
          {
            label: 'Reportes',
            icon: '📈',
            route: '/reportes',
            visible: true,
          },
          {
            label: 'Incidencias',
            icon: '🚨',
            route: '/incidencias',
            visible: true,
          },
        ],
      },
      {
        title: 'Mi Gestión',
        expanded: true,
        items: [
          {
            label: 'Mis Fichajes',
            icon: '⏱️',
            route: '/fichajes',
            visible: true,
          },
          {
            label: 'Calendario',
            icon: '📅',
            route: '/calendar',
            visible: true,
          },
        ],
      },
    ];
  }

  /**
   * Navegación para Managers
   */
  private getManagerNavigation(): SidebarSection[] {
    return [
      {
        title: 'Gestión',
        expanded: true,
        items: [
          {
            label: 'Dashboard',
            icon: '📊',
            route: '/admin-dashboard',
            visible: true,
          },
          {
            label: 'Equipo',
            icon: '👥',
            route: '/usuarios',
            visible: true,
          },
          {
            label: 'Reportes',
            icon: '📈',
            route: '/reportes',
            visible: true,
          },
          {
            label: 'Incidencias',
            icon: '🚨',
            route: '/incidencias',
            visible: true,
          },
        ],
      },
      {
        title: 'Mi Gestión',
        expanded: true,
        items: [
          {
            label: 'Mis Fichajes',
            icon: '⏱️',
            route: '/fichajes',
            visible: true,
          },
          {
            label: 'Calendario',
            icon: '📅',
            route: '/calendar',
            visible: true,
          },
          {
            label: 'Mis Reportes',
            icon: '📄',
            route: '/reportes',
            visible: true,
          },
        ],
      },
    ];
  }

  /**
   * Navegación para Empleados
   */
  private getEmployeeNavigation(): SidebarSection[] {
    return [
      {
        title: 'Principal',
        expanded: true,
        items: [
          {
            label: 'Dashboard',
            icon: '🏠',
            route: '/home',
            visible: true,
          },
          {
            label: 'Fichajes',
            icon: '⏱️',
            route: '/fichajes',
            visible: true,
          },
          {
            label: 'Calendario',
            icon: '📅',
            route: '/calendar',
            visible: true,
          },
        ],
      },
    ];
  }
}
