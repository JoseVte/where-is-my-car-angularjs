import { SavedLocationWithCategory } from '../../model/saved-location.model';
import { dayKey, formatDayRange, matchesFilters, presetRange } from './history-filters';

const location = (overrides: Partial<SavedLocationWithCategory>): SavedLocationWithCategory => ({
    id: 1,
    displayName: 'Plaza Mayor 30',
    latitude: 40.415,
    longitude: -3.707,
    address: 'Sol, Madrid',
    city: 'Madrid',
    date: new Date(2026, 9, 22, 10, 0).toISOString(),
    categoryId: 3,
    category: null,
    ...overrides,
});
const noFilters = { query: '', range: null, categoryIds: new Set<number>() };

describe('history filters', () => {
    const today = new Date(2026, 9, 22, 18, 30);

    it('builds the Android presets from the local day', () => {
        expect(presetRange('today', today)).toEqual({ start: '2026-10-22', end: '2026-10-22' });
        expect(presetRange('yesterday', today)).toEqual({ start: '2026-10-21', end: '2026-10-21' });
        expect(presetRange('last_7_days', today)).toEqual({ start: '2026-10-15', end: '2026-10-22' });
    });

    it('crosses month boundaries', () => {
        expect(presetRange('last_7_days', new Date(2026, 2, 3))).toEqual({ start: '2026-02-24', end: '2026-03-03' });
    });

    it('formats custom ranges like the Android chip', () => {
        expect(formatDayRange({ start: '2026-10-01', end: '2026-10-22' })).toBe('01-10 - 22-10 (2026)');
        expect(formatDayRange({ start: '2025-12-28', end: '2026-01-03' })).toBe('28-12-2025 - 03-01-2026');
    });

    it('filters by local day, both ends included', () => {
        const range = { start: '2026-10-22', end: '2026-10-22' };

        expect(matchesFilters(location({}), { ...noFilters, range })).toBe(true);
        expect(matchesFilters(location({ date: new Date(2026, 9, 22, 23, 59).toISOString() }), { ...noFilters, range })).toBe(true);
        expect(matchesFilters(location({ date: new Date(2026, 9, 21, 23, 59).toISOString() }), { ...noFilters, range })).toBe(false);
        expect(matchesFilters(location({ date: null }), { ...noFilters, range })).toBe(false);
    });

    it('keeps locations in any of the selected categories', () => {
        expect(matchesFilters(location({ categoryId: 3 }), { ...noFilters, categoryIds: new Set([1, 3]) })).toBe(true);
        expect(matchesFilters(location({ categoryId: 2 }), { ...noFilters, categoryIds: new Set([1, 3]) })).toBe(false);
    });

    it('searches name, address, city and note ignoring case', () => {
        expect(matchesFilters(location({}), { ...noFilters, query: 'plaza' })).toBe(true);
        expect(matchesFilters(location({}), { ...noFilters, query: 'SOL' })).toBe(true);
        expect(matchesFilters(location({ note: 'Planta -2' }), { ...noFilters, query: 'planta' })).toBe(true);
        expect(matchesFilters(location({}), { ...noFilters, query: 'barcelona' })).toBe(false);
    });

    it('formats days in local time', () => {
        expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});
