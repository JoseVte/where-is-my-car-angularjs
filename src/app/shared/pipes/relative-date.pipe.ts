import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from '../../i18n/i18n';

/** Largest unit first. */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
];

/**
 * "Just now", "5 minutes ago", "yesterday" during the last week, the full date after that. Uses Intl in the app
 * language instead of the Android "%1$d minutes ago" strings, which have no plural forms.
 */
@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
    private readonly i18n = inject(I18n);

    transform(value: string | null | undefined, now = Date.now()): string {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const seconds = Math.round((date.getTime() - now) / 1000);
        if (Math.abs(seconds) < 60) {
            return this.i18n.t('just_now');
        }

        if (Math.abs(seconds) < 60 * 60 * 24 * 7) {
            const [unit, size] = UNITS.find(([, size]) => Math.abs(seconds) >= size)!;
            return new Intl.RelativeTimeFormat(this.i18n.language, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
        }

        return new Intl.DateTimeFormat(this.i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    }
}
