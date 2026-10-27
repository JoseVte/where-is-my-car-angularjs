import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { SavedLocation, SavedLocationWithCategory } from '../../model/saved-location.model';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { LocationActions } from '../../service/location-actions';
import { ConfirmDeleteDialog } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog';
import { Icon } from '../../shared/components/icon/icon';
import { HighlightPipe } from '../../shared/pipes/highlight.pipe';
import { LongDatePipe } from '../../shared/pipes/long-date.pipe';
import { MapThumbnail } from '../map-thumbnail/map-thumbnail';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';

/** Height of the three menu items plus padding, to decide whether the menu fits below its button. */
const MENU_HEIGHT = 3 * 44 + 18;

/**
 * Android location list (LocationAdapter): item_location cards with the "more" menu (location_item_menu)
 * and the delete confirmation dialog. Used by the map bottom sheet and the history.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '(document:click)': 'closeMenu()', '(document:keydown.escape)': 'closeMenu()' },
    imports: [CategoryLabelPipe, ConfirmDeleteDialog, HighlightPipe, Icon, LongDatePipe, MapThumbnail, TranslatePipe],
    selector: 'app-location-list',
    templateUrl: './location-list.html',
})
export class LocationList {
    locations = input.required<SavedLocationWithCategory[]>();
    selectedId = input<number | null>(null);
    /** Highlighted in the title and the address. */
    query = input('');

    open = output<number>();
    deleted = output<number>();

    private readonly actions = inject(LocationActions);
    private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');
    private readonly confirmDialog = viewChild.required(ConfirmDeleteDialog);

    protected readonly openMenuId = signal<number | null>(null);
    protected readonly menuPosition = signal({ top: 0, right: 0 });
    protected readonly menuLocation = computed(() => this.locations().find(({ id }) => id === this.openMenuId()) ?? null);

    /** The menu is a popover (top layer), so the sheet transform and the scroll containers cannot clip it. */
    protected toggleMenu(id: number, event: Event): void {
        event.stopPropagation();
        if (this.openMenuId() === id) {
            this.closeMenu();
            return;
        }

        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        const bottomNav = parseFloat(getComputedStyle(button).getPropertyValue('--app-bottom-nav-height')) || 0;
        const fitsBelow = rect.bottom + MENU_HEIGHT <= window.innerHeight - bottomNav;

        this.menuPosition.set({
            top: fitsBelow ? rect.bottom + 4 : rect.top - MENU_HEIGHT - 4,
            right: window.innerWidth - rect.right,
        });
        this.openMenuId.set(id);
        this.menu().nativeElement.showPopover();
    }

    protected closeMenu(): void {
        if (this.openMenuId() === null) {
            return;
        }
        this.openMenuId.set(null);
        this.menu().nativeElement.hidePopover();
    }

    protected edit(location: SavedLocation): void {
        this.closeMenu();
        this.actions.edit(location);
    }

    protected share(location: SavedLocation): void {
        this.closeMenu();
        this.actions.share(location);
    }

    /** Android asks with a dialog (delete_confirmation_title / _message) unless confirm_deletion is off. */
    protected async askDelete(location: SavedLocation): Promise<void> {
        this.closeMenu();
        if ((await this.confirmDialog().ask()) && (await this.actions.delete(location))) {
            this.deleted.emit(location.id);
        }
    }
}
