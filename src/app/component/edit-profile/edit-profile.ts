import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { I18n } from '../../i18n/i18n';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Auth } from '../../service/auth';
import { Icon } from '../../shared/components/icon/icon';
import { goBack } from '../../shared/go-back';

/** Firebase minimum password length. */
export const PASSWORD_MIN_LENGTH = 6;
/** API limit for the display name (users.display_name). */
export const NAME_MAX_LENGTH = 100;

/** Already translated message under each form. */
type Status = { error: string } | { success: string } | null;

/**
 * Profile of the signed in user: name, and for email and password accounts the email (confirmed by a
 * link Firebase sends) and the password. Email and password changes ask for the current password.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Icon, NgTemplateOutlet, TranslatePipe],
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.html',
})
export class EditProfile implements OnInit {
    private readonly auth = inject(Auth);
    private readonly router = inject(Router);
    private readonly i18n = inject(I18n);

    protected readonly user = this.auth.user;
    protected readonly hasPassword = this.auth.hasPassword;
    protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;
    protected readonly nameMaxLength = NAME_MAX_LENGTH;

    protected readonly name = signal('');
    protected readonly newEmail = signal('');
    protected readonly emailPassword = signal('');
    protected readonly currentPassword = signal('');
    protected readonly newPassword = signal('');
    protected readonly repeatPassword = signal('');

    protected readonly saving = signal<'name' | 'email' | 'password' | null>(null);
    protected readonly nameStatus = signal<Status>(null);
    protected readonly emailStatus = signal<Status>(null);
    protected readonly passwordStatus = signal<Status>(null);

    ngOnInit(): void {
        this.name.set(this.user()?.displayName ?? '');
    }

    protected back(): void {
        goBack(this.router, '/settings');
    }

    protected async saveName(form: NgForm): Promise<void> {
        if (form.invalid || this.saving()) {
            return;
        }

        this.saving.set('name');
        this.nameStatus.set(null);
        try {
            await this.auth.updateDisplayName(this.name().trim());
            this.nameStatus.set({ success: this.i18n.t('web_profile_saved') });
        } catch (error) {
            this.nameStatus.set({ error: this.i18n.t(profileErrorKey(error)) });
        } finally {
            this.saving.set(null);
        }
    }

    protected async saveEmail(form: NgForm): Promise<void> {
        if (form.invalid || this.saving()) {
            return;
        }

        this.saving.set('email');
        this.emailStatus.set(null);
        const email = this.newEmail().trim();
        try {
            await this.auth.changeEmail(this.emailPassword(), email);
            this.emailStatus.set({ success: this.i18n.t('web_email_verification_sent', email) });
            this.emailPassword.set('');
            form.resetForm({ newEmail: email, emailPassword: '' });
        } catch (error) {
            this.emailStatus.set({ error: this.i18n.t(profileErrorKey(error)) });
        } finally {
            this.saving.set(null);
        }
    }

    protected async savePassword(form: NgForm): Promise<void> {
        if (form.invalid || this.saving()) {
            return;
        }
        if (this.newPassword() !== this.repeatPassword()) {
            this.passwordStatus.set({ error: this.i18n.t('web_passwords_dont_match') });
            return;
        }

        this.saving.set('password');
        this.passwordStatus.set(null);
        try {
            await this.auth.changePassword(this.currentPassword(), this.newPassword());
            this.passwordStatus.set({ success: this.i18n.t('web_password_changed') });
            this.currentPassword.set('');
            this.newPassword.set('');
            this.repeatPassword.set('');
            form.resetForm();
        } catch (error) {
            this.passwordStatus.set({ error: this.i18n.t(profileErrorKey(error)) });
        } finally {
            this.saving.set(null);
        }
    }
}

/** Translation key for the Firebase error codes of these forms. */
export function profileErrorKey(error: unknown): string {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'web_error_wrong_password';
            case 'auth/email-already-in-use':
                return 'web_error_email_in_use';
            case 'auth/invalid-email':
                return 'web_invalid_email';
            case 'auth/weak-password':
                return 'web_error_weak_password';
            case 'auth/too-many-requests':
                return 'web_error_too_many_requests';
            case 'auth/network-request-failed':
                return 'web_error_network';
        }
    }
    return 'web_profile_update_error';
}
