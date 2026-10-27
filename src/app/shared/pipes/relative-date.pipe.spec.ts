import { TestBed } from '@angular/core/testing';
import { I18n } from '../../i18n/i18n';
import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
    let pipe: RelativeDatePipe;
    const now = new Date('2026-10-21T12:00:00Z').getTime();
    const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: I18n, useValue: { language: 'en', t: (key: string) => (key === 'just_now' ? 'Just now' : key) } }],
        });
        pipe = TestBed.runInInjectionContext(() => new RelativeDatePipe());
    });

    it('is empty for missing or invalid dates', () => {
        expect(pipe.transform(null, now)).toBe('');
        expect(pipe.transform('not a date', now)).toBe('');
    });

    it('says just now under a minute', () => {
        expect(pipe.transform(ago(30), now)).toBe('Just now');
    });

    it('uses the largest unit during the last week', () => {
        const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

        expect(pipe.transform(ago(5 * 60), now)).toBe(relative.format(-5, 'minute'));
        expect(pipe.transform(ago(3 * 60 * 60), now)).toBe(relative.format(-3, 'hour'));
        expect(pipe.transform(ago(2 * 24 * 60 * 60), now)).toBe(relative.format(-2, 'day'));
    });

    it('shows the full date after a week', () => {
        const date = ago(10 * 24 * 60 * 60);

        expect(pipe.transform(date, now)).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)));
    });
});
