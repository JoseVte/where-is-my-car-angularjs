import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from './i18n';

/** `{{ 'save_current_position' | t }}`, `{{ 'web_count_of' | t: shown : total }}`. Pure: the language never changes without a reload. */
@Pipe({ name: 't' })
export class TranslatePipe implements PipeTransform {
    private readonly i18n = inject(I18n);

    transform(key: string, ...args: unknown[]): string {
        return this.i18n.t(key, ...args);
    }
}
