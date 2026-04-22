import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth/interceptors/auth.interceptor';
import { REPORT_PORT_TOKEN } from './core/application/ports/report.port';
import { I18nStore } from './core/i18n/i18n.store';
import { JsonReportRepository } from './core/infraestructure/repositories/report/json-report.repository';

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
      provide: REPORT_PORT_TOKEN,
      useClass: JsonReportRepository,
    },
  ],
};
