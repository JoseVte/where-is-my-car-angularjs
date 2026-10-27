import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { Preferences } from '../../preferences';

let nextId = 0;

/**
 * Android showDeleteConfirmationDialog (DialogUtils): title, message, "Don't ask again", Delete and Cancel.
 * With the confirm_deletion setting off it does not open and confirms straight away.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe],
    selector: 'app-confirm-delete-dialog',
    templateUrl: './confirm-delete-dialog.html',
})
export class ConfirmDeleteDialog {
    /** Translation keys. */
    title = input.required<string>();
    message = input.required<string>();

    private readonly preferences = inject(Preferences);
    private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

    protected readonly id = `confirm-delete-${nextId++}`;
    protected readonly dontAskAgain = signal(false);
    private resolve: ((confirmed: boolean) => void) | null = null;

    /** Resolves to true when the user confirms (or confirmation is turned off). */
    ask(): Promise<boolean> {
        if (!this.preferences.confirmDeletion()) {
            return Promise.resolve(true);
        }

        this.dontAskAgain.set(false);
        this.dialog().nativeElement.showModal();
        return new Promise((resolve) => (this.resolve = resolve));
    }

    protected confirm(): void {
        if (this.dontAskAgain()) {
            this.preferences.setConfirmDeletion(false);
        }
        this.finish(true);
    }

    /** Cancel, Escape and the dialog closing in any other way. */
    protected finish(confirmed: boolean): void {
        this.resolve?.(confirmed);
        this.resolve = null;
        if (this.dialog().nativeElement.open) {
            this.dialog().nativeElement.close();
        }
    }
}
