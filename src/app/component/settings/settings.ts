import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18n, LanguageSelection } from '../../i18n/i18n';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Auth } from '../../service/auth';
import { CategoryService } from '../../service/category.service';
import { GeolocationService } from '../../service/geolocation.service';
import { SavedLocationService } from '../../service/saved-location.service';
import { Icon } from '../../shared/components/icon/icon';
import { goBack } from '../../shared/go-back';
import { Notice } from '../../shared/notice';
import { Preferences } from '../../shared/preferences';
import { Theme, ThemeSelection } from '../../theme/theme';

/**
 * Android SettingsFragment for the web: account (the signed in sync card), appearance, language and the
 * app settings card. Sync options do not apply, the web always works against the API.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, RouterLink, TranslatePipe],
    selector: 'app-settings',
    templateUrl: './settings.html',
})
export class Settings implements OnInit {
    private readonly auth = inject(Auth);
    private readonly router = inject(Router);
    private readonly savedLocationService = inject(SavedLocationService);
    private readonly categoryService = inject(CategoryService);
    private readonly geolocation = inject(GeolocationService);
    private readonly notice = inject(Notice);
    protected readonly theme = inject(Theme);
    protected readonly i18n = inject(I18n);
    protected readonly preferences = inject(Preferences);

    protected readonly user = this.auth.user;
    protected readonly initial = computed(() => (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase());
    /** Shown only when the photo loads (Google accounts); otherwise the initial. */
    protected readonly photoFailed = signal(false);

    /** Android pref_sync_card_logged_in stats; the web has only the API counts, no local copy. */
    protected readonly locationCount = signal<number | null>(null);
    protected readonly categoryCount = signal<number | null>(null);

    /** Same options and order as the Android toggles. */
    protected readonly themeOptions: { value: ThemeSelection; label: string }[] = [
        { value: 'light', label: 'light' },
        { value: 'dark', label: 'dark' },
        { value: 'system', label: 'system' },
    ];
    protected readonly languageOptions: { value: LanguageSelection; label: string }[] = [
        { value: 'en', label: 'english' },
        { value: 'es', label: 'spanish' },
        { value: 'system', label: 'system' },
    ];

    ngOnInit(): void {
        this.loadStats();
    }

    protected back(): void {
        goBack(this.router, '/map');
    }

    /** Android asks for the location permission when the switch is turned on and leaves it off if denied. */
    protected async toggleLocationService(): Promise<void> {
        if (this.preferences.locationService()) {
            this.preferences.setLocationService(false);
            return;
        }

        try {
            await this.geolocation.getCurrentPosition();
            this.preferences.setLocationService(true);
        } catch {
            this.notice.show('web_location_permission_denied');
        }
    }

    protected async logout(): Promise<void> {
        await this.auth.logout();
        await this.router.navigateByUrl('/login');
    }

    private async loadStats(): Promise<void> {
        try {
            const [locations, categories] = await Promise.all([
                firstValueFrom(this.savedLocationService.getAll()),
                firstValueFrom(this.categoryService.getAllCategories()),
            ]);
            this.locationCount.set(locations.length);
            this.categoryCount.set(categories.length);
        } catch {
            // The counts are informative: without them the boxes show a dash
        }
    }
}
