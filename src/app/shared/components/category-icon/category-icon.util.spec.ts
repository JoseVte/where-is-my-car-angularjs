import { mdiAirplane, mdiCoffeeOutline, mdiHomeOutline, mdiMapMarker } from '@mdi/js';
import { categoryIcon, reducedIconName } from './category-icon.util';
import { CATEGORY_ICONS } from './category-icons';

const category = (icon: string) => ({ id: 1, label: 'Test', icon, color: '#E65100' });

describe('reducedIconName', () => {
    it('reduces the Android and API forms to the same name', () => {
        expect(reducedIconName('@drawable/ic_home')).toBe('home');
        expect(reducedIconName('ic_home')).toBe('home');
        expect(reducedIconName('home')).toBe('home');
        expect(reducedIconName('@drawable/ic_location_plus')).toBe('location_plus');
    });

    it('is null for emojis', () => {
        expect(reducedIconName('🚗')).toBeNull();
        expect(reducedIconName('😋')).toBeNull();
    });
});

describe('categoryIcon', () => {
    it('resolves the Android drawable and the API reduced name to the same icon', () => {
        expect(categoryIcon(category('@drawable/ic_home'))).toEqual({ type: 'icon', path: mdiHomeOutline });
        expect(categoryIcon(category('ic_home'))).toEqual({ type: 'icon', path: mdiHomeOutline });
        expect(categoryIcon(category('home'))).toEqual({ type: 'icon', path: mdiHomeOutline });
        expect(categoryIcon(category('@drawable/ic_coffee'))).toEqual({ type: 'icon', path: mdiCoffeeOutline });
    });

    it('maps every icon the Android category picker offers (EditCategoryFragment.icons)', () => {
        const androidIcons = ['home', 'favorite', 'route', 'coffee', 'layers', 'history', 'settings', 'time', 'walk', 'drive', 'location', 'search', 'tags'];

        for (const icon of androidIcons) {
            expect(CATEGORY_ICONS[icon], icon).toBeDefined();
        }
    });

    it('maps the names the API seeds (DatabaseSeeder, CategoryService defaults)', () => {
        for (const icon of ['home', 'favorite', 'route', 'flight']) {
            expect(CATEGORY_ICONS[icon], icon).toBeDefined();
        }
        expect(categoryIcon(category('flight'))).toEqual({ type: 'icon', path: mdiAirplane });
    });

    it('falls back to the location pin for names it does not know', () => {
        expect(categoryIcon(category('@drawable/ic_unknown'))).toEqual({ type: 'icon', path: mdiMapMarker });
        expect(categoryIcon(category('submarine'))).toEqual({ type: 'icon', path: mdiMapMarker });
    });

    it('treats forbidden and empty icons as no icon', () => {
        expect(categoryIcon(category('ic_forbidden'))).toEqual({ type: 'none' });
        expect(categoryIcon(category('@drawable/ic_forbidden'))).toEqual({ type: 'none' });
        expect(categoryIcon(category('forbidden'))).toEqual({ type: 'none' });
        expect(categoryIcon(category(''))).toEqual({ type: 'none' });
    });

    it('renders anything that is not a name as an emoji', () => {
        expect(categoryIcon(category('🚗'))).toEqual({ type: 'emoji', emoji: '🚗' });
    });

    it('uses the location pin when there is no category', () => {
        expect(categoryIcon(null)).toEqual({ type: 'icon', path: mdiMapMarker });
    });
});
