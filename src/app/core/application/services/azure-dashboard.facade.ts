import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../../auth/models/auth.model';

export interface AzureTaskPreview {
  id: string;
  title: string;
  state: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: 'low' | 'medium' | 'high';
}

export interface AzureSprintPreview {
  name: string;
  startDate: string;
  endDate: string;
}

export interface AzureDashboardPreview {
  sprint: AzureSprintPreview;
  tasks: AzureTaskPreview[];
}

@Injectable({ providedIn: 'root' })
export class AzureDashboardFacade {
  getPreviewForUser(user: User | null): Observable<AzureDashboardPreview | null> {
    if (!user?.azureConnected) {
      return of(null);
    }

    // Placeholder until Azure Boards sync is wired to backend/Supabase.
    return of(this.buildMockPreview());
  }

  private buildMockPreview(): AzureDashboardPreview {
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const sprintStart = new Date(today);
    sprintStart.setDate(today.getDate() + mondayOffset);

    const sprintEnd = new Date(sprintStart);
    sprintEnd.setDate(sprintStart.getDate() + 13);

    return {
      sprint: {
        name: 'Sprint Actual',
        startDate: sprintStart.toISOString(),
        endDate: sprintEnd.toISOString(),
      },
      tasks: [
        {
          id: 'AZ-1021',
          title: 'Refactor de reglas de fichaje por calendario',
          state: 'In Progress',
          priority: 'high',
        },
        {
          id: 'AZ-1035',
          title: 'Validar alertas dinámicas por usuario',
          state: 'Review',
          priority: 'medium',
        },
        {
          id: 'AZ-1042',
          title: 'QA responsive dashboard mobile',
          state: 'To Do',
          priority: 'low',
        },
      ],
    };
  }
}
