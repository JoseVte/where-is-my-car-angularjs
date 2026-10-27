import { TestBed } from '@angular/core/testing';
import { formatAndroid, I18n } from './i18n';
import androidEn from '../../i18n/android.en.json';
import androidEs from '../../i18n/android.es.json';
import webEn from '../../i18n/web.en.json';
import webEs from '../../i18n/web.es.json';

describe('formatAndroid', () => {
    it('fills positional and sequential arguments', () => {
        expect(formatAndroid('Every week on %1$s at %2$s', ['Monday', '10:00'], 'en')).toBe('Every week on Monday at 10:00');
        expect(formatAndroid('%2$s, %1$s', ['a', 'b'], 'en')).toBe('b, a');
        expect(formatAndroid('%s and %s', ['a', 'b'], 'en')).toBe('a and b');
    });

    it('formats numbers in the app language', () => {
        expect(formatAndroid('%d m', [1500], 'en')).toBe('1,500 m');
        expect(formatAndroid('%d m', [1500], 'es')).toBe(new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(1500) + ' m');
        expect(formatAndroid('%.1f km away', [1.25], 'en')).toBe('1.3 km away');
        expect(formatAndroid('%.1f km', [1.25], 'es')).toBe('1,3 km');
    });

    it('unescapes percent signs and keeps placeholders without argument', () => {
        expect(formatAndroid('100%% done, %1$s', ['ok'], 'en')).toBe('100% done, ok');
        expect(formatAndroid('%1$s and %2$s', ['a'], 'en')).toBe('a and %2$s');
    });
});

describe('I18n', () => {
    afterEach(() => localStorage.clear());

    function create(selection: string | null): I18n {
        if (selection) {
            localStorage.setItem('language_selection', selection);
        }
        return TestBed.inject(I18n);
    }

    it('uses the stored selection, like the Android language_selection preference', async () => {
        const i18n = create('es');
        await i18n.load();

        expect(i18n.language).toBe('es');
        expect(i18n.t('save_current_position')).toBe('Guardar posición actual');
        expect(i18n.t('web_count_of', 2, 5)).toBe('2 de 5');
        expect(document.documentElement.lang).toBe('es');
    });

    it('falls back to the key for missing strings', async () => {
        const i18n = create('en');
        await i18n.load();

        expect(i18n.t('not_a_key')).toBe('not_a_key');
    });

    it('ignores invalid stored values', () => {
        expect(create('fr').selection).toBe('system');
    });
});

describe('translation files', () => {
    it('have the same keys in every language', () => {
        expect(Object.keys(androidEs).sort()).toEqual(Object.keys(androidEn).sort());
        expect(Object.keys(webEs).sort()).toEqual(Object.keys(webEn).sort());
    });

    it('keep web only strings under the web_ prefix, so importing Android strings never overwrites them', () => {
        expect(Object.keys(webEn).every((key) => key.startsWith('web_'))).toBe(true);
        expect(Object.keys(androidEn).some((key) => key.startsWith('web_'))).toBe(false);
    });
});
