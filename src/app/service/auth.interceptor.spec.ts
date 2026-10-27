import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../config';
import { Auth } from './auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
    const apiUrl = `${environment.apiUrl}/api/categories`;
    let http: HttpClient;
    let backend: HttpTestingController;
    let getIdToken: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        getIdToken = vi.fn(async (forceRefresh?: boolean) => (forceRefresh ? 'fresh-token' : 'cached-token'));

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: Auth, useValue: { getIdToken } },
            ],
        });

        http = TestBed.inject(HttpClient);
        backend = TestBed.inject(HttpTestingController);
    });

    afterEach(() => backend.verify());

    /** The token comes from a promise, so the request is sent after a microtask. */
    const nextRequest = async (url: string) => {
        await Promise.resolve();
        await Promise.resolve();
        return backend.expectOne(url);
    };

    it('adds the token to API requests', async () => {
        const response = firstValueFrom(http.get(apiUrl));

        const request = await nextRequest(apiUrl);
        expect(request.request.headers.get('Authorization')).toBe('Bearer cached-token');
        request.flush([]);

        await expect(response).resolves.toEqual([]);
    });

    it('never sends the token to other hosts', async () => {
        const otherUrls = ['https://nominatim.openstreetmap.org/search', `${environment.apiUrl}.evil.com/api`];

        for (const url of otherUrls) {
            const response = firstValueFrom(http.get(url));
            const request = backend.expectOne(url);
            expect(request.request.headers.has('Authorization')).toBe(false);
            request.flush({});
            await response;
        }

        expect(getIdToken).not.toHaveBeenCalled();
    });

    it('sends no Authorization header when signed out', async () => {
        getIdToken.mockResolvedValue(null);
        const response = firstValueFrom(http.get(apiUrl));

        const request = await nextRequest(apiUrl);
        expect(request.request.headers.has('Authorization')).toBe(false);
        request.flush([]);
        await response;
    });

    it('refreshes the token and retries once after a 401', async () => {
        const response = firstValueFrom(http.get(apiUrl));

        (await nextRequest(apiUrl)).flush(null, { status: 401, statusText: 'Unauthorized' });

        const retry = await nextRequest(apiUrl);
        expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
        retry.flush(['ok']);

        await expect(response).resolves.toEqual(['ok']);
        expect(getIdToken).toHaveBeenCalledWith(true);
    });

    it('gives up when the retried request is also rejected', async () => {
        const response = firstValueFrom(http.get(apiUrl));

        (await nextRequest(apiUrl)).flush(null, { status: 401, statusText: 'Unauthorized' });
        (await nextRequest(apiUrl)).flush(null, { status: 401, statusText: 'Unauthorized' });

        const error = await response.catch((e) => e);
        expect(error).toBeInstanceOf(HttpErrorResponse);
        expect(error.status).toBe(401);
        backend.expectNone(apiUrl);
    });

    it('does not retry other errors', async () => {
        const response = firstValueFrom(http.get(apiUrl));

        (await nextRequest(apiUrl)).flush(null, { status: 500, statusText: 'Server Error' });

        const error = await response.catch((e) => e);
        expect(error.status).toBe(500);
        expect(getIdToken).toHaveBeenCalledTimes(1);
    });
});
