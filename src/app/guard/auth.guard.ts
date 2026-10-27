import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../service/auth';

/** Page signed in users land on. */
export const HOME_URL = '/map';

/** Private routes: sends signed out users to /login, remembering where they wanted to go. */
export const authGuard: CanActivateFn = async (_route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    await auth.ready;
    return auth.isLoggedIn() || router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Public pages (home, login and register): signed in users go to the map instead. */
export const guestGuard: CanActivateFn = async () => {
    const auth = inject(Auth);
    const router = inject(Router);

    await auth.ready;
    return !auth.isLoggedIn() || router.parseUrl(HOME_URL);
};
