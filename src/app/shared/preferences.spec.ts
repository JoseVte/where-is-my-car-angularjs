import { TestBed } from '@angular/core/testing';
import { Preferences } from './preferences';

describe('Preferences', () => {
    afterEach(() => localStorage.clear());

    it('defaults to the Android values: location service and confirmation on', () => {
        const preferences = TestBed.inject(Preferences);

        expect(preferences.locationService()).toBe(true);
        expect(preferences.confirmDeletion()).toBe(true);
    });

    it('stores the settings under the Android keys', () => {
        TestBed.inject(Preferences).setConfirmDeletion(false);
        TestBed.inject(Preferences).setLocationService(false);

        expect(localStorage.getItem('confirm_deletion')).toBe('false');
        expect(localStorage.getItem('location_service')).toBe('false');
    });

    it('restores the stored settings', () => {
        localStorage.setItem('confirm_deletion', 'false');

        expect(TestBed.inject(Preferences).confirmDeletion()).toBe(false);
    });
});
