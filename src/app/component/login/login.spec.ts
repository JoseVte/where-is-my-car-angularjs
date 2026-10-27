import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { Auth } from '../../service/auth';
import { Login } from './login';

describe('Login', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let login: ReturnType<typeof vi.fn>;
    let router: Router;

    beforeEach(async () => {
        login = vi.fn(async () => {});

        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [provideRouter([]), { provide: Auth, useValue: { login } }],
        }).compileComponents();

        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    function submit(email: string, password: string): HTMLElement {
        const element: HTMLElement = fixture.nativeElement;
        const set = (selector: string, value: string) => {
            const input = element.querySelector<HTMLInputElement>(selector)!;
            input.value = value;
            input.dispatchEvent(new Event('input'));
        };
        set('#email', email);
        set('#password', password);
        element.querySelector('form')!.dispatchEvent(new Event('submit'));
        fixture.detectChanges();
        return element;
    }

    it('does not call Firebase when a field is empty, and says which one', () => {
        const element = submit('', '');

        expect(login).not.toHaveBeenCalled();
        expect(element.querySelector('#email-error')?.textContent).toContain('web_field_required');
        expect(element.querySelector('#password-error')?.textContent).toContain('web_field_required');
    });

    it('does not call Firebase with a malformed email', () => {
        const element = submit('not-an-email', 'secret123');

        expect(login).not.toHaveBeenCalled();
        expect(element.querySelector('#email-error')?.textContent).toContain('web_invalid_email');
        expect(element.querySelector('#password-error')).toBeNull();
    });

    it('signs in and goes to the map', async () => {
        component.loginObj.email = 'a@b.c';
        component.loginObj.password = 'secret123';

        await component.onLogin();

        expect(login).toHaveBeenCalledWith(component.loginObj);
        expect(router.navigateByUrl).toHaveBeenCalledWith('/map');
        expect(component.errorMessage()).toBeNull();
        expect(component.loading()).toBe(false);
    });

    it('shows a friendly message for wrong credentials', async () => {
        login.mockRejectedValue(new FirebaseError('auth/invalid-credential', 'Firebase: Error'));

        await component.onLogin();

        expect(component.errorMessage()).toBe('web_error_invalid_credentials');
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        expect(component.loading()).toBe(false);
    });

    it('shows a generic message for unexpected errors', async () => {
        login.mockRejectedValue(new Error('boom'));

        await component.onLogin();

        expect(component.errorMessage()).toBe('web_error_sign_in');
    });
});
