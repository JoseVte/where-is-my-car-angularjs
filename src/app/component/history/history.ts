import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Category } from '../../model/category.model';
import { SavedLocation, SavedLocationWithCategory } from '../../model/saved-location.model';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CategoryService } from '../../service/category.service';
import { LocationActions } from '../../service/location-actions';
import { SavedLocationService } from '../../service/saved-location.service';
import { categoryIcon } from '../../shared/components/category-icon/category-icon.util';
import { Icon } from '../../shared/components/icon/icon';
import { readableTextOn } from '../../shared/color';
import { LocationList } from '../location-list/location-list';
import { DatePreset, DayRange, dayKey, formatDayRange, matchesFilters, presetRange } from './history-filters';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';

/**
 * Android HistoryFragment: search, a filters panel (date presets and categories), the active filters
 * when the panel is closed, and every saved location. Opening one shows its details.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CategoryLabelPipe, FormsModule, Icon, LocationList, RouterLink, TranslatePipe],
    selector: 'app-history',
    templateUrl: './history.html',
})
export class History implements OnInit {
    private readonly savedLocationService = inject(SavedLocationService);
    private readonly categoryService = inject(CategoryService);
    protected readonly actions = inject(LocationActions);
    private readonly rangeDialog = viewChild.required<ElementRef<HTMLDialogElement>>('rangeDialog');

    protected readonly locations = signal<SavedLocation[]>([]);
    protected readonly categories = signal<Category[]>([]);
    protected readonly loading = signal(true);
    protected readonly loadError = signal(false);

    protected readonly search = signal('');
    protected readonly filtersOpen = signal(false);
    protected readonly preset = signal<DatePreset | null>(null);
    protected readonly customRange = signal<DayRange | null>(null);
    protected readonly categoryIds = signal<ReadonlySet<number>>(new Set());

    /** Values of the custom range dialog. */
    protected readonly draftStart = signal('');
    protected readonly draftEnd = signal('');

    protected readonly presets: Exclude<DatePreset, 'custom'>[] = ['today', 'yesterday', 'last_7_days'];

    protected readonly range = computed<DayRange | null>(() => {
        const preset = this.preset();
        if (preset === 'custom') {
            return this.customRange();
        }
        return preset ? presetRange(preset) : null;
    });

    protected readonly hasActiveFilters = computed(() => this.preset() !== null || this.categoryIds().size > 0);

    protected readonly results = computed<SavedLocationWithCategory[]>(() => {
        const categoryById = new Map(this.categories().map((category) => [category.id, category]));
        const filters = { query: this.search(), range: this.range(), categoryIds: this.categoryIds() };

        return this.locations()
            .map((location) => ({ ...location, category: categoryById.get(location.categoryId ?? undefined) ?? null }))
            .filter((location) => matchesFilters(location, filters))
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    });

    /** Chips of the categories, Android createFilterChip colors (solid when selected, 15% otherwise). */
    protected readonly categoryChips = computed(() =>
        this.categories().map((category) => ({
            category,
            icon: categoryIcon(category),
            selected: category.id !== undefined && this.categoryIds().has(category.id),
            textOnColor: readableTextOn(category.color),
        })),
    );

    protected readonly customLabel = computed(() => {
        const range = this.customRange();
        return this.preset() === 'custom' && range ? formatDayRange(range) : null;
    });

    ngOnInit(): void {
        this.load();
    }

    protected async load(): Promise<void> {
        this.loading.set(true);
        this.loadError.set(false);

        try {
            const [locations, categories] = await Promise.all([
                firstValueFrom(this.savedLocationService.getAll()),
                firstValueFrom(this.categoryService.getAllCategories()),
            ]);
            this.locations.set(locations);
            this.categories.set(categories);
        } catch {
            this.loadError.set(true);
        } finally {
            this.loading.set(false);
        }
    }

    protected selectPreset(preset: Exclude<DatePreset, 'custom'> | null): void {
        this.preset.set(preset);
    }

    protected toggleCategory(id: number | undefined): void {
        if (id === undefined) {
            return;
        }
        this.categoryIds.update((ids) => {
            const next = new Set(ids);
            if (!next.delete(id)) {
                next.add(id);
            }
            return next;
        });
    }

    protected clearCategories(): void {
        this.categoryIds.set(new Set());
    }

    /** Android opens a MaterialDatePicker range; here a dialog with two date fields. */
    protected openCustomRange(): void {
        const current = this.customRange() ?? presetRange('last_7_days');
        this.draftStart.set(current.start);
        this.draftEnd.set(current.end);
        this.rangeDialog().nativeElement.showModal();
    }

    protected applyCustomRange(): void {
        const [start, end] = [this.draftStart(), this.draftEnd()].sort();
        if (start && end) {
            this.customRange.set({ start, end });
            this.preset.set('custom');
        }
        this.rangeDialog().nativeElement.close();
    }


    protected removeLocation(id: number): void {
        this.locations.update((locations) => locations.filter((location) => location.id !== id));
    }

    protected readonly today = dayKey(new Date());
}
