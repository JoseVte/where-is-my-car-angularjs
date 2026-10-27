import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n, LanguageSelection } from '../../../i18n/i18n';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { Icon } from '../icon/icon';

/** Same options as the Android language toggle (pref_language_toggle). Changing it reloads the page. */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, TranslatePipe],
    selector: 'app-language-select',
    templateUrl: './language-select.html',
})
export class LanguageSelect {
    protected readonly i18n = inject(I18n);

    protected readonly options: { value: LanguageSelection; label: string }[] = [
        { value: 'system', label: 'system' },
        { value: 'en', label: 'english' },
        { value: 'es', label: 'spanish' },
    ];

    protected change(event: Event): void {
        this.i18n.setLanguage((event.target as HTMLSelectElement).value as LanguageSelection);
    }
}
