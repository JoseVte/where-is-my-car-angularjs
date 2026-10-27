import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Category } from '../../../model/category.model';
import { categoryIcon } from './category-icon.util';

/** Category icon on a tile of the category color at 15% alpha, like the Android app. */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'inline-flex shrink-0 items-center justify-center rounded-button size-11 text-xl',
        '[style.color]': 'color()',
        '[style.background-color]': 'color() + "26"',
    },
    selector: 'app-category-icon',
    templateUrl: './category-icon.html',
})
export class CategoryIcon {
    category = input<Category | null>(null);

    protected color = computed(() => this.category()?.color ?? '#7D6E5D');
    protected icon = computed(() => categoryIcon(this.category()));
}
