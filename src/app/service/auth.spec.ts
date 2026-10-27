import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FIREBASE_AUTH } from '../firebase';
import { Auth } from './auth';

/** Minimal stand in for the Firebase Auth instance (the modular functions delegate to these methods). */
function fakeFirebaseAuth(user: { getIdToken: (force?: boolean) => Promise<string> } | null) {
    return {
        currentUser: user,
        onAuthStateChanged: (next: (u: unknown) => void) => {
            queueMicrotask(() => next(user));
            return () => {};
        },
        signOut: vi.fn(async () => {}),
    };
}

describe('Auth', () => {
    function setUp(user: Parameters<typeof fakeFirebaseAuth>[0]) {
        const firebaseAuth = fakeFirebaseAuth(user);
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: FIREBASE_AUTH, useValue: firebaseAuth },
            ],
        });
        return { service: TestBed.inject(Auth), firebaseAuth };
    }

    it('is signed out when Firebase has no user', async () => {
        const { service } = setUp(null);

        await service.ready;

        expect(service.isLoggedIn()).toBe(false);
        await expect(service.getIdToken()).resolves.toBeNull();
    });

    it('exposes the restored session and its token', async () => {
        const getIdToken = vi.fn(async (force?: boolean) => (force ? 'fresh' : 'cached'));
        const { service } = setUp({ getIdToken });

        await service.ready;

        expect(service.isLoggedIn()).toBe(true);
        await expect(service.getIdToken()).resolves.toBe('cached');
        await expect(service.getIdToken(true)).resolves.toBe('fresh');
    });

    it('waits for the session to be restored before returning a token', async () => {
        const { service } = setUp({ getIdToken: async () => 'cached' });

        // Called before onAuthStateChanged fired: must still get the token, not null
        await expect(service.getIdToken()).resolves.toBe('cached');
    });

    it('signs out through Firebase', async () => {
        const { service, firebaseAuth } = setUp(null);

        await service.logout();

        expect(firebaseAuth.signOut).toHaveBeenCalled();
    });
});
