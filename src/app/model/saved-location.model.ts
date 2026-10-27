import { Category } from './category.model';

/** Saved location as returned by `GET /api/saved-locations` (same shape the Android app syncs). */
export interface SavedLocation {
    id: number;
    displayName: string;
    latitude: number;
    longitude: number;
    country?: string | null;
    city?: string | null;
    address?: string | null;
    addressData?: Record<string, string> | null;
    /** ISO 8601 in UTC. */
    date?: string | null;
    note?: string | null;
    categoryId?: number | null;
}

/** Body of `POST` and `PUT /api/saved-locations`. The API requires the category. */
export type SavedLocationBody = Omit<SavedLocation, 'id' | 'categoryId'> & { categoryId: number };

/** Saved location with its category resolved, ready to render. */
export interface SavedLocationWithCategory extends SavedLocation {
    category: Category | null;
}
