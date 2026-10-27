import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { isSystemLabel, SYSTEM_LABEL_PREFIX } from '../../model/category.model';

/** Android getResolvedLabel: default categories store "@string/category_home" and show it translated. */
export function resolveCategoryLabel(i18n: I18n, label: string): string {
    return isSystemLabel(label) ? i18n.t(label.slice(SYSTEM_LABEL_PREFIX.length)) : label;
}

/** `{{ category.label | categoryLabel }}` */
@Pipe({ name: 'categoryLabel' })
export class CategoryLabelPipe implements PipeTransform {
    private readonly i18n = inject(I18n);

    transform(label: string): string {
        return resolveCategoryLabel(this.i18n, label);
    }
}
