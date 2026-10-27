import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../config';
import { I18n } from './i18n';

/** Tells the API the app language, which it uses to translate its error messages (like the Android AuthInterceptor). */
export const languageInterceptor: HttpInterceptorFn = (request, next) =>
    request.url.startsWith(`${environment.apiUrl}/`) ? next(request.clone({ setHeaders: { 'Accept-Language': inject(I18n).language } })) : next(request);
