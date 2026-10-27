import { InjectionToken } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { environment } from './config';

/**
 * Firebase Auth instance. Injected through a token so tests can replace it.
 *
 * Firebase refreshes the ID token by itself before it expires (tokens last one hour), so the app never
 * stores or renews tokens. To keep the session across reloads the SDK persists the signed in user,
 * including its tokens, in IndexedDB (localStorage only if IndexedDB is not available). Any storage
 * readable from JavaScript is exposed to XSS, so keep the Content Security Policy strict.
 */
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
    providedIn: 'root',
    factory: () =>
        initializeAuth(initializeApp(environment.firebase), {
            persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        }),
});
