import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpLoadingService } from '../../http/http-loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private readonly httpLoadingService = inject(HttpLoadingService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.shouldSkipLoader(request)) {
      return next.handle(request);
    }

    this.httpLoadingService.startRequest();

    return next.handle(request).pipe(
      finalize(() => this.httpLoadingService.endRequest()),
    );
  }

  private shouldSkipLoader(request: HttpRequest<unknown>): boolean {
    if (request.headers.has('x-skip-loader')) {
      return true;
    }

    return request.url.includes('/assets/i18n/');
  }
}
