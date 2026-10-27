import { Service } from '@angular/core';

export type Language = 'en' | 'es';
/** Same values the Android app stores in the "language_selection" preference. */
export type LanguageSelection = Language | 'system';

export const LANGUAGES: readonly Language[] = ['en', 'es'];
const FALLBACK_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'language_selection';

type Strings = Record<string, string>;

/** Android strings (scripts/import-android-strings.mjs) plus the web only ones (web_ prefix). */
const LOADERS: Record<Language, () => Promise<Strings[]>> = {
    en: () => Promise.all([import('../../i18n/android.en.json'), import('../../i18n/web.en.json')]).then((files) => files.map((file) => file.default)),
    es: () => Promise.all([import('../../i18n/android.es.json'), import('../../i18n/web.es.json')]).then((files) => files.map((file) => file.default)),
};

/**
 * Translations, keyed like the Android string resources. The language is fixed for the whole page
 * load (like Android recreating the activity), so changing it reloads the page.
 */
@Service()
export class I18n {
    readonly selection: LanguageSelection = readSelection();
    readonly language: Language = this.selection === 'system' ? systemLanguage() : this.selection;

    private strings: Strings = {};
    private fallback: Strings = {};

    /** Runs once before the app starts. */
    async load(): Promise<void> {
        const [current, fallback] = await Promise.all([
            LOADERS[this.language](),
            this.language === FALLBACK_LANGUAGE ? Promise.resolve([]) : LOADERS[FALLBACK_LANGUAGE](),
        ]);

        this.strings = Object.assign({}, ...current);
        this.fallback = Object.assign({}, ...fallback);
        document.documentElement.lang = this.language;
    }

    /** Translated string with Android format arguments (%1$s, %d, %.1f...). Missing keys fall back to English, then to the key. */
    t(key: string, ...args: unknown[]): string {
        const template = this.strings[key] ?? this.fallback[key];

        if (template === undefined) {
            console.warn(`Missing translation: ${key}`);
            return key;
        }

        return args.length > 0 ? formatAndroid(template, args, this.language) : template;
    }

    setLanguage(selection: LanguageSelection): void {
        localStorage.setItem(STORAGE_KEY, selection);
        location.reload();
    }
}

function readSelection(): LanguageSelection {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'system' || LANGUAGES.includes(stored as Language) ? (stored as LanguageSelection) : 'system';
}

function systemLanguage(): Language {
    const preferred = navigator.languages.map((language) => language.split('-')[0]);
    return (preferred.find((language) => LANGUAGES.includes(language as Language)) as Language | undefined) ?? FALLBACK_LANGUAGE;
}

/** Subset of java.util.Formatter used by the Android strings: %s, %d, %f with optional position (%1$s) and precision (%.1f). */
export function formatAndroid(template: string, args: unknown[], locale: string): string {
    let next = 0;

    return template.replace(/%(?:(\d+)\$)?(?:\.(\d+))?([sdf%])/g, (match, position: string | undefined, precision: string | undefined, conversion: string) => {
        if (conversion === '%') {
            return '%';
        }

        const value = args[position ? Number(position) - 1 : next++];
        if (value === undefined) {
            return match;
        }

        switch (conversion) {
            case 'd':
                return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value));
            case 'f': {
                const digits = precision === undefined ? 6 : Number(precision);
                return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value));
            }
            default:
                return String(value);
        }
    });
}
