export interface Category {
    id?: number;
    label: string;
    /**
     * Icon name in any of its forms: "@drawable/ic_home" or "ic_home" (Android app), "home" (API),
     * "forbidden" for no icon, or an emoji. See category-icon.util.ts.
     */
    icon: string;
    /** "#RRGGBB" */
    color: string;
}

/** Default categories store an Android string resource as label: translated on display and not editable. */
export const SYSTEM_LABEL_PREFIX = '@string/';

export function isSystemLabel(label: string): boolean {
    return label.startsWith(SYSTEM_LABEL_PREFIX);
}

/** Category the Android app assigns to locations saved without choosing one (DBHelper.defaultCategory). */
export const DEFAULT_CATEGORY: Category = { label: '@string/category_others', icon: '@drawable/ic_route', color: '#7D6E5D' };
