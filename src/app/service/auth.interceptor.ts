import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../config';
import { Auth } from './auth';

/**
 * Adds the Firebase ID token to requests to the API, and only to the API (the token must never reach
 * other hosts). On a 401 it asks Firebase for a fresh token and retries once.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
    if (!isApiRequest(request)) {
        return next(request);
    }

    const auth = inject(Auth);

    return from(auth.getIdToken()).pipe(
        switchMap((token) => next(withToken(request, token))),
        catchError((error) => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            return from(auth.getIdToken(true)).pipe(
                switchMap((token) => (token ? next(withToken(request, token)) : throwError(() => error))),
            );
        }),
    );
};

/** Prefix match on "<apiUrl>/", so a host like "localhost:8080.evil.com" never matches. */
function isApiRequest(request: HttpRequest<unknown>): boolean {
    return request.url.startsWith(`${environment.apiUrl}/`);
}

function withToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
    return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}
