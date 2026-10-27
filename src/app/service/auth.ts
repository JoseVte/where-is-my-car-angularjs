import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
    EmailAuthProvider,
    onAuthStateChanged,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    updateProfile,
    User,
    verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { environment } from '../config';
import { FIREBASE_AUTH } from '../firebase';
import { LoginModel } from '../model/login.model';

/**
 * Session of the user, backed by Firebase Auth. The API does not issue tokens: it validates Firebase
 * ID tokens, which `authInterceptor` adds to every API request.
 */
@Service()
export class Auth {
    private readonly auth = inject(FIREBASE_AUTH);
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api`;

    /** Signed in Firebase user, or null. Firebase updates the same object, so every set notifies. */
    readonly user = signal<User | null>(null, { equal: () => false });
    readonly isLoggedIn = computed(() => this.user() !== null);
    /** Email and password account (Google accounts manage email and password in Google). */
    readonly hasPassword = computed(() => this.user()?.providerData.some(({ providerId }) => providerId === 'password') ?? false);

    /** Resolves once Firebase has restored the previous session (or found none). */
    readonly ready: Promise<void>;

    constructor() {
        this.ready = new Promise((resolve) => {
            onAuthStateChanged(this.auth, (user) => {
                this.user.set(user);
                resolve();
            });
        });
    }

    async login(credentials: LoginModel): Promise<void> {
        await signInWithEmailAndPassword(this.auth, credentials.email.trim(), credentials.password);

        // Creates the user in the API the first time (and refreshes its email and name)
        await firstValueFrom(this.http.get(`${this.apiUrl}/me`));
    }

    /** Updates Firebase and then the API, which reads the name from the refreshed token (/api/me). */
    async updateDisplayName(displayName: string): Promise<void> {
        const user = this.currentUser();
        await updateProfile(user, { displayName });
        await user.getIdToken(true);
        await firstValueFrom(this.http.get(`${this.apiUrl}/me`));
        this.user.set(user);
    }

    /** Firebase sends a link to the new address; the email changes when it is opened. */
    async changeEmail(currentPassword: string, newEmail: string): Promise<void> {
        const user = await this.reauthenticate(currentPassword);
        await verifyBeforeUpdateEmail(user, newEmail);
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.reauthenticate(currentPassword);
        await updatePassword(user, newPassword);
    }

    logout(): Promise<void> {
        return signOut(this.auth);
    }

    /**
     * Current Firebase ID token, or null when signed out. Firebase returns the cached token and refreshes
     * it automatically when it is about to expire. `forceRefresh` asks for a new one (used after a 401).
     */
    async getIdToken(forceRefresh = false): Promise<string | null> {
        await this.ready;
        return (await this.auth.currentUser?.getIdToken(forceRefresh)) ?? null;
    }

    private currentUser(): User {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Not signed in');
        }
        return user;
    }

    /** Email and password changes need a recent sign in, so they ask for the current password. */
    private async reauthenticate(currentPassword: string): Promise<User> {
        const user = this.currentUser();
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', currentPassword));
        return user;
    }
}
