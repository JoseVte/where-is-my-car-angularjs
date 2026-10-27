import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { Auth } from './service/auth';

/** Navigates with the real routes (nothing is rendered, there is no outlet) and returns the final url. */
async function navigate(url: string, loggedIn: boolean): Promise<string> {
    TestBed.configureTestingModule({
        providers: [provideRouter(routes), { provide: Auth, useValue: { ready: Promise.resolve(), isLoggedIn: signal(loggedIn) } }],
    });

    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    return router.url;
}

describe('routes', () => {
    it('sends signed in users from the home page to the map', async () => {
        expect(await navigate('/', true)).toBe('/map');
    });

    it('sends signed in users from login to the map', async () => {
        expect(await navigate('/login', true)).toBe('/map');
    });

    it('shows the home page to signed out users', async () => {
        expect(await navigate('/', false)).toBe('/');
    });

    it('sends signed out users from the map to login, remembering the page', async () => {
        expect(await navigate('/map', false)).toBe('/login?returnUrl=%2Fmap');
    });
});
