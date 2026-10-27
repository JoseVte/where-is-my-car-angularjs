import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { I18n } from '../../i18n/i18n';
import { resolveCategoryLabel } from './category-label.pipe';

describe('resolveCategoryLabel', () => {
    it('translates the labels of the default categories', () => {
        const i18n = TestBed.inject(I18n);

        expect(resolveCategoryLabel(i18n, '@string/category_others')).toBe(i18n.t('category_others'));
        expect(resolveCategoryLabel(i18n, '@string/category_others')).not.toContain('@string/');
    });

    it('leaves the labels the user wrote as they are', () => {
        expect(resolveCategoryLabel(TestBed.inject(I18n), 'Airport')).toBe('Airport');
    });
});
