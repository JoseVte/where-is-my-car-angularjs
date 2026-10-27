import { TestBed } from '@angular/core/testing';
import { Theme } from './theme';

describe('Theme', () => {
    let systemDark: boolean;
    let notifySystemChange: () => void;

    beforeEach(() => {
        systemDark = false;
        // jsdom has no matchMedia
        window.matchMedia = ((query: string) => ({
            get matches() {
                return systemDark;
            },
            media: query,
            addEventListener: (_: string, listener: () => void) => (notifySystemChange = listener),
            removeEventListener: () => {},
        })) as unknown as typeof window.matchMedia;
    });

    afterEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset['theme'];
    });

    it('follows the system by default, like the Android theme_selection', () => {
        TestBed.inject(Theme);
        expect(document.documentElement.dataset['theme']).toBe('light');

        systemDark = true;
        notifySystemChange();
        expect(document.documentElement.dataset['theme']).toBe('dark');
    });

    it('applies and remembers an explicit choice, ignoring the system', () => {
        const theme = TestBed.inject(Theme);
        theme.setTheme('dark');

        expect(document.documentElement.dataset['theme']).toBe('dark');
        expect(localStorage.getItem('theme_selection')).toBe('dark');

        systemDark = false;
        notifySystemChange();
        expect(document.documentElement.dataset['theme']).toBe('dark');
    });

    it('restores the stored choice', () => {
        localStorage.setItem('theme_selection', 'light');
        systemDark = true;

        expect(TestBed.inject(Theme).selection()).toBe('light');
        expect(document.documentElement.dataset['theme']).toBe('light');
    });
});
