import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { Auth } from '../service/auth';
import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
    function setUp(loggedIn: boolean) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: Auth, useValue: { ready: Promise.resolve(), isLoggedIn: signal(loggedIn) } },
            ],
        });
        return TestBed.inject(Router);
    }

    const run = (guard: typeof authGuard, url = '/categories') =>
        TestBed.runInInjectionContext(() => guard({} as never, { url } as never)) as Promise<boolean | UrlTree>;

    it('authGuard lets signed in users through', async () => {
        setUp(true);
        await expect(run(authGuard)).resolves.toBe(true);
    });

    it('authGuard sends signed out users to /login with the return url', async () => {
        const router = setUp(false);
        const result = await run(authGuard);
        expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fcategories');
    });

    it('guestGuard sends signed in users to the map', async () => {
        const router = setUp(true);
        const result = await run(guestGuard);
        expect(router.serializeUrl(result as UrlTree)).toBe('/map');
    });

    it('guestGuard lets signed out users see the login page', async () => {
        setUp(false);
        await expect(run(guestGuard)).resolves.toBe(true);
    });
});
