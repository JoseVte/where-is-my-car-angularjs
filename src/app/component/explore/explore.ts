import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Category, DEFAULT_CATEGORY } from '../../model/category.model';
import { SavedLocation, SavedLocationBody, SavedLocationWithCategory } from '../../model/saved-location.model';
import { I18n } from '../../i18n/i18n';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CategoryService } from '../../service/category.service';
import { Coordinates, GeolocationError, GeolocationService } from '../../service/geolocation.service';
import { LocationActions } from '../../service/location-actions';
import { SavedLocationService } from '../../service/saved-location.service';
import { Breakpoint } from '../../shared/breakpoint';
import { BottomSheet, BottomSheetState } from '../../shared/components/bottom-sheet/bottom-sheet';
import { CategoryIcon } from '../../shared/components/category-icon/category-icon';
import { Icon } from '../../shared/components/icon/icon';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { Notice } from '../../shared/notice';
import { Preferences } from '../../shared/preferences';
import { LocationList } from '../location-list/location-list';
import { LocationMap } from '../location-map/location-map';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';

/**
 * Map with the saved locations, the list and the button to save the current position (Android ExploreFragment).
 * Below lg it is the Android screen (full map, floating search, bottom sheet); from lg, list and map side by side.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BottomSheet, CategoryIcon, CategoryLabelPipe, FormsModule, Icon, LocationList, LocationMap, RelativeDatePipe, TranslatePipe],
    selector: 'app-explore',
    styleUrl: './explore.css',
    templateUrl: './explore.html',
})
export class Explore implements OnInit {
    private readonly savedLocationService = inject(SavedLocationService);
    private readonly categoryService = inject(CategoryService);
    private readonly geolocation = inject(GeolocationService);
    private readonly i18n = inject(I18n);
    private readonly notice = inject(Notice);
    private readonly preferences = inject(Preferences);
    /** Android hides the 'my location' button when location_service is off. */
    protected readonly locationService = this.preferences.locationService;
    protected readonly actions = inject(LocationActions);
    private readonly map = viewChild.required(LocationMap);
    private readonly sheet = viewChild(BottomSheet);
    private stopFollowing: (() => void) | null = null;

    protected readonly locations = signal<SavedLocation[]>([]);
    protected readonly categories = signal<Category[]>([]);
    protected readonly loading = signal(true);
    /** Messages are translation keys. */
    protected readonly loadError = signal<string | null>(null);

    protected readonly userPosition = signal<Coordinates | null>(null);
    protected readonly saving = signal(false);
    protected readonly saveError = signal<string | null>(null);

    protected readonly selectedId = signal<number | null>(null);
    protected readonly confirmDeleteId = signal<number | null>(null);

    protected readonly search = signal('');
    protected readonly categoryFilter = signal<number | null>(null);

    protected readonly isMobile = inject(Breakpoint).isMobile;
    protected readonly sheetState = signal<BottomSheetState>('collapsed');
    /** Map area covered by the bottom sheet, so the map centers above it. */
    protected readonly mapBottomInset = computed(() => this.sheet()?.visibleHeight() ?? 0);

    protected readonly locationsWithCategory = computed<SavedLocationWithCategory[]>(() => {
        const categoryById = new Map(this.categories().map((category) => [category.id, category]));

        return this.locations()
            .map((location) => ({ ...location, category: categoryById.get(location.categoryId ?? undefined) ?? null }))
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    });

    protected readonly filteredLocations = computed(() => {
        const query = this.search().trim().toLocaleLowerCase();
        const categoryId = this.categoryFilter();

        return this.locationsWithCategory().filter(
            (location) =>
                (categoryId === null || location.categoryId === categoryId) &&
                (query === '' || [location.displayName, location.address, location.city, location.note].some((text) => text?.toLocaleLowerCase().includes(query))),
        );
    });

    /** Categories with at least one location, with their count, for the filter chips. */
    protected readonly categoryChips = computed(() =>
        this.categories()
            .map((category) => ({ category, count: this.locations().filter((location) => location.categoryId === category.id).length }))
            .filter(({ count }) => count > 0),
    );

    constructor() {
        inject(DestroyRef).onDestroy(() => this.stopFollowing?.());
    }

    ngOnInit(): void {
        this.load();
        this.followPositionIfAllowed();
    }

    protected async load(): Promise<void> {
        this.loading.set(true);
        this.loadError.set(null);

        try {
            const [locations, categories] = await Promise.all([
                firstValueFrom(this.savedLocationService.getAll()),
                firstValueFrom(this.categoryService.getAllCategories()),
            ]);
            this.locations.set(locations);
            this.categories.set(categories);
        } catch {
            this.loadError.set('web_load_error');
        } finally {
            this.loading.set(false);
        }
    }

    /** Like the Android save button: stores the position straight away, name and category are edited later. */
    protected async saveCurrentPosition(): Promise<void> {
        if (this.saving()) {
            return;
        }

        this.saving.set(true);
        this.saveError.set(null);

        try {
            const position = await this.geolocation.getCurrentPosition();
            this.userPosition.set(position);
            this.startFollowingPosition();

            const address = await this.geolocation.reverseGeocode(position);
            const body: SavedLocationBody = {
                displayName: address?.displayName || this.i18n.t('unknown_location'),
                latitude: position.latitude,
                longitude: position.longitude,
                address: address?.address ?? null,
                city: address?.city ?? null,
                country: address?.country ?? null,
                addressData: address?.addressData ?? null,
                date: new Date().toISOString(),
                note: null,
                categoryId: await this.defaultCategoryId(),
            };

            const saved = await firstValueFrom(this.savedLocationService.create(body));
            this.locations.update((locations) => [saved, ...locations]);
            this.search.set('');
            this.categoryFilter.set(null);
            this.selectedId.set(saved.id);
            this.notice.show('web_location_saved');
        } catch (error) {
            this.saveError.set(saveErrorMessage(error));
        } finally {
            this.saving.set(false);
        }
    }

    protected async centerOnUser(): Promise<void> {
        if (this.userPosition()) {
            this.map().centerOnUser();
            return;
        }

        try {
            this.userPosition.set(await this.geolocation.getCurrentPosition());
            this.startFollowingPosition();
            this.map().centerOnUser();
        } catch (error) {
            this.saveError.set(saveErrorMessage(error));
        }
    }

    /** A marker was tapped: highlight it in the list (raising the sheet on mobile so the item is visible). */
    protected select(id: number): void {
        this.selectedId.set(id);
        if (this.isMobile() && this.sheetState() === 'collapsed') {
            this.sheetState.set('half');
        }
        document.getElementById(`location-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /** Desktop list: inline confirmation, skipped when confirm_deletion is off. */
    protected requestDelete(location: SavedLocation): void {
        if (this.preferences.confirmDeletion()) {
            this.confirmDeleteId.set(location.id);
        } else {
            this.delete(location);
        }
    }

    /** Desktop list: deleted after the inline confirmation. */
    protected async delete(location: SavedLocation): Promise<void> {
        this.confirmDeleteId.set(null);
        if (await this.actions.delete(location)) {
            this.removeLocation(location.id);
        }
    }

    protected removeLocation(id: number): void {
        this.locations.update((locations) => locations.filter((location) => location.id !== id));
        if (this.selectedId() === id) {
            this.selectedId.set(null);
        }
    }

    /** Android: focusing the search expands the sheet, searching moves it to half. */
    protected submitSearch(input: HTMLInputElement): void {
        input.blur();
        this.sheetState.set('half');
    }

    protected toggleCategoryFilter(categoryId: number | undefined): void {
        this.categoryFilter.update((current) => (current === categoryId || categoryId === undefined ? null : categoryId));
    }

    /** Android getOrCreateDefaultCategory: the default category, else the first one, else a new default category. */
    private async defaultCategoryId(): Promise<number> {
        const categories = this.categories();
        const existing = categories.find(({ label }) => label.toLowerCase() === DEFAULT_CATEGORY.label.toLowerCase()) ?? categories[0];
        if (existing?.id !== undefined) {
            return existing.id;
        }

        const created = await firstValueFrom(this.categoryService.createCategory(DEFAULT_CATEGORY));
        this.categories.update((current) => [...current, created]);
        return created.id!;
    }

    /** Follows the user only if the permission was already granted, so opening the page never prompts. */
    private async followPositionIfAllowed(): Promise<void> {
        if (!this.preferences.locationService()) {
            return;
        }
        try {
            const status = await navigator.permissions?.query({ name: 'geolocation' });
            if (status?.state === 'granted') {
                this.startFollowingPosition();
            }
        } catch {
            // Permissions API not available: wait until the user asks for the position
        }
    }

    /** Android location_service off: no position updates, only the explicit requests (save, route). */
    private startFollowingPosition(): void {
        if (!this.preferences.locationService()) {
            return;
        }
        this.stopFollowing ??= this.geolocation.watchPosition(
            (position) => this.userPosition.set(position),
            () => {},
        );
    }

}

function saveErrorMessage(error: unknown): string {
    if (error instanceof GeolocationError) {
        switch (error.reason) {
            case 'denied':
                return 'web_geo_denied';
            case 'unsupported':
                return 'web_geo_unsupported';
            case 'timeout':
                return 'web_geo_timeout';
            default:
                return 'web_geo_unavailable';
        }
    }

    return 'web_save_error';
}
