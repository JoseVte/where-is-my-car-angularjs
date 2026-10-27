import { FirebaseError } from 'firebase/app';
import { describe, expect, it } from 'vitest';
import { profileErrorKey } from './edit-profile';

describe('profileErrorKey', () => {
    it('maps the Firebase codes of the profile forms', () => {
        expect(profileErrorKey(new FirebaseError('auth/invalid-credential', ''))).toBe('web_error_wrong_password');
        expect(profileErrorKey(new FirebaseError('auth/wrong-password', ''))).toBe('web_error_wrong_password');
        expect(profileErrorKey(new FirebaseError('auth/email-already-in-use', ''))).toBe('web_error_email_in_use');
        expect(profileErrorKey(new FirebaseError('auth/weak-password', ''))).toBe('web_error_weak_password');
        expect(profileErrorKey(new FirebaseError('auth/too-many-requests', ''))).toBe('web_error_too_many_requests');
    });

    it('falls back to the generic message', () => {
        expect(profileErrorKey(new FirebaseError('auth/internal-error', ''))).toBe('web_profile_update_error');
        expect(profileErrorKey(new Error('boom'))).toBe('web_profile_update_error');
    });
});
