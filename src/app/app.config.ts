import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth/interceptors/auth.interceptor';
import { LoadingInterceptor } from './core/auth/interceptors/loading.interceptor';
import { REPORT_PORT_TOKEN } from './core/application/ports/report.port';
import { FICHAJE_PORT_TOKEN } from './core/application/ports/fichaje.port';
import { TIMELINE_PORT_TOKEN } from './core/application/ports/timeline.port';
import { TEAM_REPORT_PORT_TOKEN } from './core/application/ports/team-report.port';
import { PROFILES_PORT_TOKEN } from './core/application/ports/profiles.port';
import { INCIDENCIAS_PORT_TOKEN } from './core/application/ports/incidencias.port';
import { WORKFORCE_PORT_TOKEN } from './core/application/ports/workforce.port';
import { CATALOG_ITEM_PORT_TOKEN } from './core/application/ports/catalog-item.port';
import { I18nStore } from './core/i18n/i18n.store';
import { SupabaseReportRepository } from './core/infraestructure/repositories/report/supabase-report.repository';
import { SupabaseFichajeRepository } from './core/infraestructure/repositories/supabase-fichaje.repository';
import { SupabaseTimelineRepository } from './core/infraestructure/repositories/timeline/supabase-timeline.repository';
import { SupabaseTeamReportRepository } from './core/infraestructure/repositories/report/supabase-team-report.repository';
import { SupabaseProfilesRepository } from './core/infraestructure/repositories/profiles/supabase-profiles.repository';
import { SupabaseIncidenciasRepository } from './core/infraestructure/repositories/incidencias/supabase-incidencias.repository';
import { SupabaseWorkforceRepository } from './core/infraestructure/repositories/workforce/supabase-workforce.repository';
import { SupabaseCatalogRepository } from './core/infraestructure/repositories/catalog/supabase-catalog.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAppInitializer(() => inject(I18nStore).init()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
    {
      provide: REPORT_PORT_TOKEN,
      useClass: SupabaseReportRepository,
    },
    {
      provide: FICHAJE_PORT_TOKEN,
      useClass: SupabaseFichajeRepository,
    },
    {
      provide: TIMELINE_PORT_TOKEN,
      useClass: SupabaseTimelineRepository,
    },
    {
      provide: TEAM_REPORT_PORT_TOKEN,
      useClass: SupabaseTeamReportRepository,
    },
    {
      provide: PROFILES_PORT_TOKEN,
      useClass: SupabaseProfilesRepository,
    },
    {
      provide: INCIDENCIAS_PORT_TOKEN,
      useClass: SupabaseIncidenciasRepository,
    },
    {
      provide: WORKFORCE_PORT_TOKEN,
      useClass: SupabaseWorkforceRepository,
    },
    {
      provide: CATALOG_ITEM_PORT_TOKEN,
      useClass: SupabaseCatalogRepository,
    },
  ],
};

