import { Injectable } from '@angular/core';
import { SidebarSection } from '../../../shared/models/navigation.model';
import { User, UserRole } from '../../../core/auth/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  /**
   * Genera las secciones del sidebar según el rol del usuario
   */
  getNavigationByRole(role: UserRole, user?: User | null): SidebarSection[] {
    switch (role) {
      case UserRole.ADMIN:
        return this.getAdminNavigation();
      case UserRole.MANAGER:
        return this.getManagerNavigation();
      case UserRole.EMPLOYEE:
        return this.getEmployeeNavigation(user);
      case UserRole.GENERIC:
        return this.getGenericNavigation();
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
            route: '/configuracion/usuarios',
            visible: true,
          },
          {
            label: 'Catálogos',
            icon: '🗂️',
            route: '/configuracion/catalogos',
            visible: true,
          },
          {
            label: 'Reportes',
            icon: '📈',
            route: '/reportes',
            visible: true,
          },
          {
            label: 'Team Leaders',
            icon: '🧭',
            route: '/team-leaders',
            visible: true,
          },
          {
            label: 'Vacaciones',
            icon: '🏖️',
            route: '/vacaciones',
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
            label: 'Team Leaders',
            icon: '🧭',
            route: '/team-leaders',
            visible: true,
          },
          {
            label: 'Vacaciones',
            icon: '🏖️',
            route: '/vacaciones',
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
  private getEmployeeNavigation(user?: User | null): SidebarSection[] {
    const pendingAssignment = !user?.managerId && !user?.isTeamLeader;
    const items = [
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
        disabled: pendingAssignment,
        disabledReason: 'Pendiente de asignacion por manager',
      },
      {
        label: 'Vacaciones',
        icon: '🏖️',
        route: '/vacaciones',
        visible: true,
        disabled: pendingAssignment,
        disabledReason: 'Pendiente de asignacion por manager',
      },
    ];

    if (user?.isTeamLeader) {
      items.push({
        label: 'Mi Equipo TL',
        icon: '🧭',
        route: '/team-leaders',
        visible: true,
      });
    }

    return [
      {
        title: 'Principal',
        expanded: true,
        items,
      },
    ];
  }

  /**
   * Navegación para usuario recién registrado pendiente de asignación.
   */
  private getGenericNavigation(): SidebarSection[] {
    return [
      {
        title: 'Inicio',
        expanded: true,
        items: [
          {
            label: 'Dashboard',
            icon: '🏠',
            route: '/home',
            visible: true,
            disabled: true,
            disabledReason: 'Pendiente de asignacion por manager',
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
            disabled: true,
            disabledReason: 'Pendiente de asignacion por manager',
          },
          {
            label: 'Vacaciones',
            icon: '🏖️',
            route: '/vacaciones',
            visible: true,
            disabled: true,
            disabledReason: 'Pendiente de asignacion por manager',
          },
          {
            label: 'Reportes',
            icon: '📈',
            route: '/reportes',
            visible: true,
            disabled: true,
            disabledReason: 'Pendiente de asignacion por manager',
          },
        ],
      },
    ];
  }
}
