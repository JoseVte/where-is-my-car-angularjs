import {
    mdiAirplane,
    mdiBeach,
    mdiBriefcaseOutline,
    mdiCar,
    mdiClockOutline,
    mdiCoffeeOutline,
    mdiCog,
    mdiHeartOutline,
    mdiHistory,
    mdiHomeOutline,
    mdiLayers,
    mdiMagnify,
    mdiMapMarker,
    mdiMapMarkerPath,
    mdiTagMultipleOutline,
    mdiWalk,
} from '@mdi/js';

/**
 * Category icons by their reduced name: the Android drawable without "@drawable/ic_" ("@drawable/ic_home"
 * is "home"), which is also how the API stores them. Values are Material Design Icons 24x24 paths.
 */
export const CATEGORY_ICONS: Record<string, string> = {
    // Android category picker (EditCategoryFragment.icons)
    home: mdiHomeOutline,
    favorite: mdiHeartOutline,
    route: mdiMapMarkerPath,
    coffee: mdiCoffeeOutline,
    layers: mdiLayers,
    history: mdiHistory,
    settings: mdiCog,
    time: mdiClockOutline,
    walk: mdiWalk,
    drive: mdiCar,
    location: mdiMapMarker,
    search: mdiMagnify,
    tags: mdiTagMultipleOutline,

    // Other names used by the API (seeder and default categories)
    flight: mdiAirplane,
    work: mdiBriefcaseOutline,
    place: mdiMapMarker,
    house: mdiHomeOutline,
    beach: mdiBeach,
};

/** Icons offered by the category editor, in the Android order (EditCategoryFragment.icons, after "none" and emoji). */
export const PICKER_ICONS = ['home', 'favorite', 'route', 'coffee', 'layers', 'history', 'settings', 'time', 'walk', 'drive', 'location', 'search', 'tags'] as const;

/** Reduced name meaning "no icon" (Android ic_forbidden). */
export const NO_ICON = 'forbidden';

/** Used for locations without category and for names this map does not know yet. */
export const FALLBACK_CATEGORY_ICON = mdiMapMarker;
