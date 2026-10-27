import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { Theme, ThemeSelection } from '../../../theme/theme';
import { Icon } from '../icon/icon';

/** Same options as the Android theme toggle (pref_theme_toggle). */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, TranslatePipe],
    selector: 'app-theme-select',
    templateUrl: './theme-select.html',
})
export class ThemeSelect {
    protected readonly theme = inject(Theme);

    protected readonly options: { value: ThemeSelection; label: string }[] = [
        { value: 'system', label: 'system' },
        { value: 'light', label: 'light' },
        { value: 'dark', label: 'dark' },
    ];

    protected change(event: Event): void {
        this.theme.setTheme((event.target as HTMLSelectElement).value as ThemeSelection);
    }
}
