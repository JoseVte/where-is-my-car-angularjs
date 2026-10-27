import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18n } from '../../i18n/i18n';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { SavedLocationWithCategory } from '../../model/saved-location.model';
import { CategoryService } from '../../service/category.service';
import { Coordinates, GeolocationService } from '../../service/geolocation.service';
import { LocationActions } from '../../service/location-actions';
import { googleMapsDirectionsUrl, Route, RouteService, RouteStep, TravelMode } from '../../service/route.service';
import { SavedLocationService } from '../../service/saved-location.service';
import { Breakpoint } from '../../shared/breakpoint';
import { CategoryIcon } from '../../shared/components/category-icon/category-icon';
import { Icon } from '../../shared/components/icon/icon';
import { formatAddress, formatCoordinates } from '../../shared/coordinates';
import { goBack } from '../../shared/go-back';
import { Notice } from '../../shared/notice';
import { Preferences } from '../../shared/preferences';
import { LongDatePipe } from '../../shared/pipes/long-date.pipe';
import { LocationMap } from '../location-map/location-map';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';

/**
 * Android LocationDetailsFragment: the location on a map with a route to it (walking or driving, OSRM),
 * its steps, and every saved detail with edit, share and copy coordinates.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CategoryIcon, CategoryLabelPipe, Icon, LocationMap, LongDatePipe, RouterLink, TranslatePipe],
    selector: 'app-location-details',
    templateUrl: './location-details.html',
})
export class LocationDetails implements OnInit {
    /** Route parameter. */
    id = input.required<string>();

    private readonly savedLocationService = inject(SavedLocationService);
    private readonly categoryService = inject(CategoryService);
    private readonly geolocation = inject(GeolocationService);
    private readonly routeService = inject(RouteService);
    private readonly notice = inject(Notice);
    private readonly preferences = inject(Preferences);
    /** Android hides the 'my location' button when location_service is off. */
    protected readonly locationService = this.preferences.locationService;
    private readonly i18n = inject(I18n);
    private readonly router = inject(Router);
    protected readonly actions = inject(LocationActions);
    private readonly map = viewChild(LocationMap);
    /** Android has no zoom buttons on mobile, only pinch. */
    protected readonly isMobile = inject(Breakpoint).isMobile;
    private stopFollowing: (() => void) | null = null;

    protected readonly location = signal<SavedLocationWithCategory | null>(null);
    protected readonly loading = signal(true);
    protected readonly notFound = signal(false);

    protected readonly userPosition = signal<Coordinates | null>(null);
    protected readonly mode = signal<TravelMode>('walk');
    protected readonly route = signal<Route | null>(null);
    protected readonly routing = signal(false);
    protected readonly navigating = signal(false);

    protected readonly googleMapsUrl = computed(() => {
        const route = this.route();
        return route ? googleMapsDirectionsUrl(route) : null;
    });

    protected readonly locations = computed(() => (this.location() ? [this.location()!] : []));
    protected readonly coordinates = computed(() => {
        const location = this.location();
        return location ? formatCoordinates(location.latitude, location.longitude, this.i18n) : '';
    });
    protected readonly address = computed(() => {
        const location = this.location();
        return location ? formatAddress(location.address, location.city, location.country) : '';
    });

    /** Android btn_start_navigation text, the three steps of its state machine. */
    protected readonly routeButtonLabel = computed(() => (!this.route() ? 'calculate_route' : this.navigating() ? 'stop_navigation' : 'start_navigation'));

    protected readonly distanceLabel = computed(() => {
        const distance = this.route()?.distance;
        if (distance === undefined) {
            return '';
        }
        return distance < 1000 ? this.i18n.t('distance_m_away', Math.round(distance)) : this.i18n.t('distance_km_away', distance / 1000);
    });

    protected readonly timeLabel = computed(() => {
        const duration = this.route()?.duration;
        if (duration === undefined) {
            return '';
        }

        const minutes = Math.max(1, Math.round(duration / 60));
        const suffix = this.mode() === 'walk' ? 'walking' : 'driving';
        return minutes < 60
            ? this.i18n.t(`time_min_${suffix}`, minutes)
            : this.i18n.t(`time_hr_min_${suffix}`, Math.floor(minutes / 60), minutes % 60);
    });

    constructor() {
        inject(DestroyRef).onDestroy(() => this.stopFollowing?.());
    }

    ngOnInit(): void {
        this.load();
        this.followPositionIfAllowed();
    }

    protected async load(): Promise<void> {
        this.loading.set(true);
        this.notFound.set(false);

        try {
            const [location, categories] = await Promise.all([
                firstValueFrom(this.savedLocationService.get(Number(this.id()))),
                firstValueFrom(this.categoryService.getAllCategories()),
            ]);
            this.location.set({ ...location, category: categories.find(({ id }) => id === location.categoryId) ?? null });
        } catch {
            this.notFound.set(true);
        } finally {
            this.loading.set(false);
        }
    }

    protected back(): void {
        goBack(this.router, '/history');
    }

    protected async copyCoordinates(): Promise<void> {
        await navigator.clipboard.writeText(this.coordinates());
        this.notice.show('coords_copied');
    }

    protected async centerOnUser(): Promise<void> {
        if (!this.userPosition() && !(await this.requestPosition())) {
            return;
        }
        this.map()?.centerOnUser();
    }

    protected onRouteButton(): void {
        if (!this.route()) {
            this.calculateRoute();
        } else if (this.navigating()) {
            this.navigating.set(false);
        } else {
            this.navigating.set(true);
            this.notice.show('navigation_started');
        }
    }

    protected setMode(mode: TravelMode): void {
        if (this.mode() === mode) {
            return;
        }
        this.mode.set(mode);
        if (this.route()) {
            this.calculateRoute();
        }
    }

    protected removeRoute(): void {
        this.route.set(null);
        this.navigating.set(false);
        this.map()?.centerOnSelected();
    }

    protected stepText(step: RouteStep): string {
        const instruction = this.i18n.t(step.instruction);
        return step.name && step.instruction !== 'web_step_arrive' ? this.i18n.t('web_step_onto', instruction, step.name) : instruction;
    }

    protected stepDistance(step: RouteStep): string {
        return step.distance < 1000 ? this.i18n.t('distance_m_short', Math.round(step.distance)) : this.i18n.t('distance_km_short', step.distance / 1000);
    }

    protected focusStep(step: RouteStep): void {
        this.map()?.focusPoint(step.latitude, step.longitude);
    }

    private async calculateRoute(): Promise<void> {
        const location = this.location();
        if (!location || this.routing()) {
            return;
        }

        const from = this.userPosition() ?? (await this.requestPosition());
        if (!from) {
            return;
        }

        this.routing.set(true);
        try {
            this.route.set(await this.routeService.route(from, location, this.mode()));
        } catch {
            this.route.set(null);
            this.notice.show('error_loading_route');
        } finally {
            this.routing.set(false);
        }
    }

    /** Android shows waiting_for_gps when there is no fix yet; the browser also asks for permission here. */
    private async requestPosition(): Promise<Coordinates | null> {
        try {
            const position = await this.geolocation.getCurrentPosition();
            this.userPosition.set(position);
            this.startFollowingPosition();
            return position;
        } catch {
            this.notice.show('waiting_for_gps');
            return null;
        }
    }

    private async followPositionIfAllowed(): Promise<void> {
        if (!this.preferences.locationService()) {
            return;
        }
        try {
            const status = await navigator.permissions?.query({ name: 'geolocation' });
            if (status?.state === 'granted') {
                this.startFollowingPosition();
            }
        } catch {
            // Permissions API not available: wait until the user asks for a route
        }
    }

    /** Android location_service off: no position updates, only the explicit requests (save, route). */
    private startFollowingPosition(): void {
        if (!this.preferences.locationService()) {
            return;
        }
        this.stopFollowing ??= this.geolocation.watchPosition(
            (position) => this.userPosition.set(position),
            () => {},
        );
    }
}
