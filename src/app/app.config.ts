import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { I18n } from './i18n/i18n';
import { languageInterceptor } from './i18n/language.interceptor';
import { TranslatedTitleStrategy } from './i18n/translated-title.strategy';
import { authInterceptor } from './service/auth.interceptor';
import { Theme } from './theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Strings and theme must be ready before the first render
    provideAppInitializer(() => inject(I18n).load()),
    provideAppInitializer(() => void inject(Theme)),
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideHttpClient(withFetch(), withInterceptors([languageInterceptor, authInterceptor]))
  ]
};
