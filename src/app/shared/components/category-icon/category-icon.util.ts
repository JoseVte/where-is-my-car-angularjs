import { Category } from '../../../model/category.model';
import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON, NO_ICON } from './category-icons';

export type ResolvedCategoryIcon =
    | { type: 'icon'; path: string; emoji?: undefined }
    | { type: 'emoji'; emoji: string; path?: undefined }
    | { type: 'none'; path?: undefined; emoji?: undefined };

/**
 * The icon of a category can be "@drawable/ic_home" or "ic_home" (Android app), "home" (API), or an
 * emoji. Names are reduced to "home" and looked up in CATEGORY_ICONS; "forbidden" means no icon.
 */
export function categoryIcon(category: Category | null): ResolvedCategoryIcon {
    if (!category) {
        return { type: 'icon', path: FALLBACK_CATEGORY_ICON };
    }

    const icon = category.icon.trim();
    if (icon === '') {
        return { type: 'none' };
    }

    const name = reducedIconName(icon);
    if (name === null) {
        return { type: 'emoji', emoji: icon };
    }

    if (name === NO_ICON) {
        return { type: 'none' };
    }

    return { type: 'icon', path: CATEGORY_ICONS[name] ?? FALLBACK_CATEGORY_ICON };
}

/** "@drawable/ic_home", "ic_home" and "home" are all "home". Null when it is not a name (an emoji). */
export function reducedIconName(icon: string): string | null {
    const name = icon.replace(/^@drawable\//, '').replace(/^ic_/, '');
    return /^[a-z][a-z0-9_]*$/.test(name) ? name : null;
}
