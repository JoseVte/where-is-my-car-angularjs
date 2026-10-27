import { TestBed } from '@angular/core/testing';
import { I18n } from '../../../i18n/i18n';
import { Preferences } from '../../preferences';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';

describe('ConfirmDeleteDialog', () => {
    function create() {
        TestBed.configureTestingModule({ providers: [{ provide: I18n, useValue: { t: (key: string) => key } }] });
        const fixture = TestBed.createComponent(ConfirmDeleteDialog);
        fixture.componentRef.setInput('title', 'delete_confirmation_title');
        fixture.componentRef.setInput('message', 'delete_confirmation_message');
        fixture.detectChanges();

        const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
        // jsdom has no modal dialogs
        dialog.showModal = () => dialog.setAttribute('open', '');
        dialog.close = () => {
            dialog.removeAttribute('open');
            dialog.dispatchEvent(new Event('close'));
        };
        return { fixture, dialog };
    }

    afterEach(() => localStorage.clear());

    it('confirms without asking when confirm_deletion is off', async () => {
        localStorage.setItem('confirm_deletion', 'false');
        const { fixture, dialog } = create();

        await expect(fixture.componentInstance.ask()).resolves.toBe(true);
        expect(dialog.open).toBe(false);
    });

    it('resolves false on cancel and true on delete', async () => {
        const { fixture, dialog } = create();
        const button = (text: string) => [...dialog.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;

        const cancelled = fixture.componentInstance.ask();
        button('cancel').click();
        await expect(cancelled).resolves.toBe(false);

        const confirmed = fixture.componentInstance.ask();
        button('delete').click();
        await expect(confirmed).resolves.toBe(true);
        expect(TestBed.inject(Preferences).confirmDeletion()).toBe(true);
    });

    it('turns confirmation off with "Don\'t ask again", like Android', async () => {
        const { fixture, dialog } = create();

        const confirmed = fixture.componentInstance.ask();
        dialog.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
        [...dialog.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'delete')!.click();

        await expect(confirmed).resolves.toBe(true);
        expect(TestBed.inject(Preferences).confirmDeletion()).toBe(false);
    });
});
