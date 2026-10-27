import { Service, signal, WritableSignal } from '@angular/core';

/** Same keys and defaults as the Android SharedPreferences (AppSettingsPreference). */
const LOCATION_SERVICE_KEY = 'location_service';
const CONFIRM_DELETION_KEY = 'confirm_deletion';

/** App settings stored in the browser, like the Android app stores them on the phone. */
@Service()
export class Preferences {
    /** Off: the maps never follow the user and hide the "my location" buttons (Android location_service). */
    readonly locationService = storedBoolean(LOCATION_SERVICE_KEY, true);
    /** Off: locations and categories are deleted without the confirmation dialog (Android confirm_deletion). */
    readonly confirmDeletion = storedBoolean(CONFIRM_DELETION_KEY, true);

    setLocationService(enabled: boolean): void {
        this.save(this.locationService, LOCATION_SERVICE_KEY, enabled);
    }

    setConfirmDeletion(enabled: boolean): void {
        this.save(this.confirmDeletion, CONFIRM_DELETION_KEY, enabled);
    }

    private save(value: WritableSignal<boolean>, key: string, enabled: boolean): void {
        localStorage.setItem(key, String(enabled));
        value.set(enabled);
    }
}

function storedBoolean(key: string, fallback: boolean): WritableSignal<boolean> {
    const stored = localStorage.getItem(key);
    return signal(stored === null ? fallback : stored === 'true');
}
