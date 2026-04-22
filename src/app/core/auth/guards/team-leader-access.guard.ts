import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TeamLeaderAccessGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
    const isTeamLeaderEmployee = user.role === UserRole.EMPLOYEE && user.isTeamLeader === true;

    if (isManager || isTeamLeaderEmployee) {
      return true;
    }

    this.router.navigate(['/home']);
    return false;
  }
}
