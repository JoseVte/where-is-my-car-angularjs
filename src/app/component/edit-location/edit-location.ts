import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18n } from '../../i18n/i18n';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Category } from '../../model/category.model';
import { SavedLocation, SavedLocationWithCategory } from '../../model/saved-location.model';
import { CategoryService } from '../../service/category.service';
import { LocationActions } from '../../service/location-actions';
import { SavedLocationService } from '../../service/saved-location.service';
import { categoryIcon } from '../../shared/components/category-icon/category-icon.util';
import { ConfirmDeleteDialog } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog';
import { Icon } from '../../shared/components/icon/icon';
import { readableTextOn } from '../../shared/color';
import { formatAddress, formatCoordinates } from '../../shared/coordinates';
import { goBack } from '../../shared/go-back';
import { Notice } from '../../shared/notice';
import { LocationMap } from '../location-map/location-map';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';

/** Same limits as the API (SavedLocationRequest). */
export const NAME_MAX_LENGTH = 100;
export const NOTE_MAX_LENGTH = 500;

/**
 * Android EditLocationFragment: name, notes and category. Address, coordinates and date are read only,
 * as in the app. Saving goes back; deleting asks first and goes to the history.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CategoryLabelPipe, ConfirmDeleteDialog, FormsModule, Icon, LocationMap, RouterLink, TranslatePipe],
    selector: 'app-edit-location',
    templateUrl: './edit-location.html',
})
export class EditLocation implements OnInit {
    /** Route parameter. */
    id = input.required<string>();

    private readonly savedLocationService = inject(SavedLocationService);
    private readonly categoryService = inject(CategoryService);
    private readonly actions = inject(LocationActions);
    private readonly notice = inject(Notice);
    private readonly i18n = inject(I18n);
    private readonly router = inject(Router);
    private readonly confirmDialog = viewChild.required(ConfirmDeleteDialog);

    protected readonly nameMaxLength = NAME_MAX_LENGTH;
    protected readonly noteMaxLength = NOTE_MAX_LENGTH;

    protected readonly location = signal<SavedLocation | null>(null);
    protected readonly categories = signal<Category[]>([]);
    protected readonly loading = signal(true);
    protected readonly notFound = signal(false);
    protected readonly saving = signal(false);
    /** Translation key. */
    protected readonly error = signal<string | null>(null);

    protected readonly name = signal('');
    protected readonly note = signal('');
    protected readonly categoryId = signal<number | null>(null);

    protected readonly mapLocations = computed<SavedLocationWithCategory[]>(() => {
        const location = this.location();
        const category = this.categories().find(({ id }) => id === this.categoryId()) ?? null;
        return location ? [{ ...location, category }] : [];
    });
    protected readonly address = computed(() => {
        const location = this.location();
        return location ? formatAddress(location.address, location.city, location.country) : '';
    });
    protected readonly coordinates = computed(() => {
        const location = this.location();
        return location ? formatCoordinates(location.latitude, location.longitude, this.i18n) : '';
    });
    /** Android createFilterChip, one per category, single selection. */
    protected readonly categoryChips = computed(() =>
        this.categories().map((category) => ({
            category,
            icon: categoryIcon(category),
            selected: category.id === this.categoryId(),
            textOnColor: readableTextOn(category.color),
        })),
    );

    ngOnInit(): void {
        this.load();
    }

    protected async load(): Promise<void> {
        this.loading.set(true);
        this.notFound.set(false);

        try {
            const [location, categories] = await Promise.all([
                firstValueFrom(this.savedLocationService.get(Number(this.id()))),
                firstValueFrom(this.categoryService.getAllCategories()),
            ]);
            this.location.set(location);
            this.categories.set(categories);
            this.name.set(location.displayName ?? '');
            this.note.set(location.note ?? '');
            this.categoryId.set(location.categoryId ?? null);
        } catch {
            this.notFound.set(true);
        } finally {
            this.loading.set(false);
        }
    }

    protected back(): void {
        goBack(this.router, `/locations/${this.id()}`);
    }

    protected async copyCoordinates(): Promise<void> {
        await navigator.clipboard.writeText(this.coordinates());
        this.notice.show('coords_copied');
    }

    protected async save(): Promise<void> {
        const location = this.location();
        const categoryId = this.categoryId();
        if (!location || this.saving()) {
            return;
        }
        if (categoryId === null) {
            this.error.set('category_required');
            return;
        }

        this.saving.set(true);
        this.error.set(null);

        try {
            const { id, ...current } = location;
            await firstValueFrom(
                this.savedLocationService.update(id, {
                    ...current,
                    displayName: displayNameOrFallback(this.name(), location),
                    note: this.note().trim(),
                    categoryId,
                }),
            );
            this.notice.show('location_updated');
            this.back();
        } catch {
            this.error.set('web_update_error');
        } finally {
            this.saving.set(false);
        }
    }

    /** Android asks first (unless confirm_deletion is off) and goes back twice to the list; the web goes to the history. */
    protected async askDelete(): Promise<void> {
        const location = this.location();
        if (location && (await this.confirmDialog().ask()) && (await this.actions.delete(location))) {
            this.router.navigateByUrl('/history', { replaceUrl: true });
        }
    }
}

/** Android ApiMappers: a blank name falls back to the address, then to the coordinates (the API needs one). */
export function displayNameOrFallback(name: string, location: Pick<SavedLocation, 'address' | 'latitude' | 'longitude'>): string {
    return (
        name.trim() ||
        location.address?.trim() ||
        `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    ).slice(0, NAME_MAX_LENGTH);
}
