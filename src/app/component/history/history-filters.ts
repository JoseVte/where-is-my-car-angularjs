import { SavedLocationWithCategory } from '../../model/saved-location.model';

/** Date presets of the Android history (HistoryFragment.renderDatePresets). */
export type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'custom';

/** Inclusive range of local days, as "yyyy-MM-dd". */
export interface DayRange {
    start: string;
    end: string;
}

export interface HistoryFilters {
    query: string;
    range: DayRange | null;
    /** Empty means every category. */
    categoryIds: ReadonlySet<number>;
}

/** Local calendar day of a date, "yyyy-MM-dd", like the Android getFormattedDate. */
export function dayKey(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysFrom(today: Date, offset: number): string {
    return dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
}

/** Range of a preset. "Last 7 days" goes from 7 days ago to today, as in Android. */
export function presetRange(preset: Exclude<DatePreset, 'custom'>, today = new Date()): DayRange {
    switch (preset) {
        case 'today':
            return { start: daysFrom(today, 0), end: daysFrom(today, 0) };
        case 'yesterday':
            return { start: daysFrom(today, -1), end: daysFrom(today, -1) };
        case 'last_7_days':
            return { start: daysFrom(today, -7), end: daysFrom(today, 0) };
    }
}

/** Android getFormattedDateRange: "dd-MM - dd-MM (yyyy)", or with both years when they differ. */
export function formatDayRange({ start, end }: DayRange): string {
    const [startYear, startMonth, startDay] = start.split('-');
    const [endYear, endMonth, endDay] = end.split('-');

    return startYear === endYear
        ? `${startDay}-${startMonth} - ${endDay}-${endMonth} (${startYear})`
        : `${startDay}-${startMonth}-${startYear} - ${endDay}-${endMonth}-${endYear}`;
}

export function matchesFilters(location: SavedLocationWithCategory, { query, range, categoryIds }: HistoryFilters): boolean {
    if (categoryIds.size > 0 && (location.categoryId == null || !categoryIds.has(location.categoryId))) {
        return false;
    }

    if (range) {
        const day = location.date ? dayKey(new Date(location.date)) : null;
        if (!day || day < range.start || day > range.end) {
            return false;
        }
    }

    const needle = query.trim().toLocaleLowerCase();
    return needle === '' || [location.displayName, location.address, location.city, location.note].some((text) => text?.toLocaleLowerCase().includes(needle));
}
