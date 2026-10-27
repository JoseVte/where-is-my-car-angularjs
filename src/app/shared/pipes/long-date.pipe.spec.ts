import { TestBed } from '@angular/core/testing';
import { I18n } from '../../i18n/i18n';
import { LongDatePipe } from './long-date.pipe';

function pipeFor(language: string): LongDatePipe {
    TestBed.configureTestingModule({ providers: [{ provide: I18n, useValue: { language } }] });
    return TestBed.runInInjectionContext(() => new LongDatePipe());
}

describe('LongDatePipe', () => {
    // Local time, so the expected text does not depend on the machine time zone
    const date = new Date(2026, 2, 12, 9, 5).toISOString();

    it('formats like the Android list, every word capitalized', () => {
        expect(pipeFor('en').transform(date)).toBe('Thursday, 12 March 2026 09:05');
    });

    it('uses the app language', () => {
        expect(pipeFor('es').transform(date)).toBe('Jueves, 12 Marzo 2026 09:05');
    });

    it('is empty for missing or invalid dates', () => {
        const pipe = pipeFor('en');
        expect(pipe.transform(null)).toBe('');
        expect(pipe.transform('nope')).toBe('');
    });
});
