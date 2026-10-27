import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { HOME_URL } from '../../guard/auth.guard';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Auth } from '../../service/auth';
import { Button } from '../../shared/components/button/button';
import { LoginModel } from '../../model/login.model';

export { LoginModel } from '../../model/login.model';

@Component({
    imports: [Button, FormsModule, RouterLink, TranslatePipe],
    selector: 'app-login',
    styleUrl: './login.css',
    templateUrl: './login.html',
})
export class Login {
    loginObj: LoginModel = new LoginModel();
    loading = signal(false);
    /** Translation key of the error shown under the form. */
    errorMessage = signal<string | null>(null);

    authService = inject(Auth);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    async onLogin() {
        if (this.loading()) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            await this.authService.login(this.loginObj);

            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            // Only local paths, so the login page cannot be used to redirect to another site
            await this.router.navigateByUrl(returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : HOME_URL);
        } catch (error) {
            this.errorMessage.set(loginErrorMessage(error));
        } finally {
            this.loading.set(false);
        }
    }
}

function loginErrorMessage(error: unknown): string {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/invalid-email':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'web_error_invalid_credentials';
            case 'auth/too-many-requests':
                return 'web_error_too_many_requests';
            case 'auth/user-disabled':
                return 'web_error_user_disabled';
            case 'auth/network-request-failed':
                return 'web_error_network';
        }
    }

    return 'web_error_sign_in';
}
