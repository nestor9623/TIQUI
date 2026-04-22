import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MockJsonLoaderService {
  private readonly cache = new Map<string, Observable<object>>();

  constructor(private readonly http: HttpClient) {}

  loadJson<T>(path: string): Observable<T> {
    const cached = this.cache.get(path);
    if (cached) {
      return cached as Observable<T>;
    }

    const request$ = this.http.get<T>(path).pipe(shareReplay(1));
    this.cache.set(path, request$ as Observable<object>);
    return request$;
  }
}
