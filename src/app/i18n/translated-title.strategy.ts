import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18n } from './i18n';

/** Route titles are translation keys: `title: 'map'` becomes "Map · Where Is My Car". */
@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
    private readonly title = inject(Title);
    private readonly i18n = inject(I18n);

    override updateTitle(snapshot: RouterStateSnapshot): void {
        const key = this.buildTitle(snapshot);
        const appName = this.i18n.t('app_name');

        this.title.setTitle(key ? `${this.i18n.t(key)} · ${appName}` : appName);
    }
}
