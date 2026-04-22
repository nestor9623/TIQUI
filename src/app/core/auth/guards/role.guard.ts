import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Obtiene los roles requeridos de la ruta
    const requiredRoles = route.data['roles'] as UserRole[] | undefined;

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
