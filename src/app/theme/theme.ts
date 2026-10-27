import { DestroyRef, inject, Service, signal } from '@angular/core';

/** Same values and storage key as the Android ThemePreference ("theme_selection"). */
export type ThemeSelection = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_selection';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Applies the theme as `data-theme` on <html>, following the system while the selection is "system". */
@Service()
export class Theme {
    readonly selection = signal<ThemeSelection>(readSelection());

    private readonly systemDark = matchMedia(DARK_QUERY);

    constructor() {
        const onSystemChange = () => this.apply();
        this.systemDark.addEventListener('change', onSystemChange);
        inject(DestroyRef).onDestroy(() => this.systemDark.removeEventListener('change', onSystemChange));
        this.apply();
    }

    setTheme(selection: ThemeSelection): void {
        localStorage.setItem(STORAGE_KEY, selection);
        this.selection.set(selection);
        this.apply();
    }

    private apply(): void {
        const selection = this.selection();
        const dark = selection === 'dark' || (selection === 'system' && this.systemDark.matches);
        document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
    }
}

function readSelection(): ThemeSelection {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
}
