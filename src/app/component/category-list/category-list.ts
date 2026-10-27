import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Category } from '../../model/category.model';
import { SavedLocation } from '../../model/saved-location.model';
import { CategoryService } from '../../service/category.service';
import { SavedLocationService } from '../../service/saved-location.service';
import { CategoryIcon } from '../../shared/components/category-icon/category-icon';
import { ConfirmDeleteDialog } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog';
import { Icon } from '../../shared/components/icon/icon';
import { goBack } from '../../shared/go-back';
import { Notice } from '../../shared/notice';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';

/** Android ManageCategoriesFragment: every category with its location count, edit, delete and add. */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CategoryIcon, CategoryLabelPipe, ConfirmDeleteDialog, Icon, RouterLink, TranslatePipe],
    selector: 'app-category-list',
    templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {
    private readonly categoryService = inject(CategoryService);
    private readonly savedLocationService = inject(SavedLocationService);
    private readonly notice = inject(Notice);
    private readonly router = inject(Router);
    private readonly confirmDialog = viewChild.required(ConfirmDeleteDialog);

    protected readonly categories = signal<Category[]>([]);
    private readonly locations = signal<SavedLocation[]>([]);
    protected readonly loading = signal(true);
    protected readonly loadError = signal(false);

    /** Android location_count_text, counted from the saved locations (the API does not return it). */
    protected readonly items = computed(() =>
        this.categories().map((category) => ({
            category,
            count: this.locations().filter((location) => location.categoryId === category.id).length,
        })),
    );

    ngOnInit(): void {
        this.load();
    }

    protected async load(): Promise<void> {
        this.loading.set(true);
        this.loadError.set(false);

        try {
            const [categories, locations] = await Promise.all([
                firstValueFrom(this.categoryService.getAllCategories()),
                firstValueFrom(this.savedLocationService.getAll()),
            ]);
            this.categories.set(categories);
            this.locations.set(locations);
        } catch {
            this.loadError.set(true);
        } finally {
            this.loading.set(false);
        }
    }

    protected back(): void {
        goBack(this.router, '/settings');
    }

    /** Android delete_category_confirmation_message warns that its locations are deleted too. */
    protected async askDelete(category: Category): Promise<void> {
        if (category.id === undefined || !(await this.confirmDialog().ask())) {
            return;
        }

        try {
            await firstValueFrom(this.categoryService.deleteCategory(category.id));
            this.categories.update((categories) => categories.filter(({ id }) => id !== category.id));
            this.locations.update((locations) => locations.filter(({ categoryId }) => categoryId !== category.id));
        } catch {
            this.notice.show('web_category_delete_error');
        }
    }
}
