import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from '../../i18n/i18n';

/**
 * Date as the Android location list shows it ("EEEE, d MMMM yyyy HH:mm" with every word capitalized,
 * LocationExtensions.kt): "Thursday, 12 March 2026 10:30".
 */
@Pipe({ name: 'longDate' })
export class LongDatePipe implements PipeTransform {
    private readonly i18n = inject(I18n);

    transform(value: string | null | undefined): string {
        const date = value ? new Date(value) : null;
        if (!date || Number.isNaN(date.getTime())) {
            return '';
        }

        const parts = new Intl.DateTimeFormat(this.i18n.language, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);
        const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';

        const text = `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')} ${part('hour')}:${part('minute')}`;
        return text.replace(/(^|\s)(\p{Ll})/gu, (_, space: string, letter: string) => space + letter.toLocaleUpperCase(this.i18n.language));
    }
}
