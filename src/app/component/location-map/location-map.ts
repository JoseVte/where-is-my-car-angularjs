import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, output, signal, untracked, viewChild, ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { SavedLocationWithCategory } from '../../model/saved-location.model';
import { Coordinates } from '../../service/geolocation.service';
import { Route } from '../../service/route.service';
import { categoryIcon } from '../../shared/components/category-icon/category-icon.util';
import { loadStylesheet } from '../../shared/load-stylesheet';

const DEFAULT_CENTER: L.LatLngTuple = [40.4168, -3.7038];
/** Street level. The Android app starts at 20, OpenStreetMap tiles stop at 19. */
const LOCATION_ZOOM = 18;

/** OpenStreetMap (same MAPNIK tiles as the Android app) with a marker per saved location and the user position. */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    // Leaflet's own DOM must be reachable by these styles, see location-map.css
    encapsulation: ViewEncapsulation.None,
    imports: [TranslatePipe],
    selector: 'app-location-map',
    styleUrl: './location-map.css',
    templateUrl: './location-map.html',
})
export class LocationMap {
    locations = input<SavedLocationWithCategory[]>([]);
    userPosition = input<Coordinates | null>(null);
    selectedId = input<number | null>(null);
    /** Pixels covered at the bottom (the mobile bottom sheet): centering and the bottom controls stay above it. */
    bottomInset = input(0);
    /** Read once on creation. Hidden on mobile, where the Android app has no zoom buttons either. */
    zoomControl = input(true);
    /** Read once on creation. The OpenStreetMap attribution must stay visible, clear of floating buttons. */
    attributionPosition = input<L.ControlPosition>('bottomright');
    /** Read once on creation. False for a fixed preview (Android edit screen map). */
    interactive = input(true);
    /** Whether the first GPS fix moves the map to the user (explore) or leaves it on the location (details). */
    centerOnUserFirstFix = input(true);
    /** Route line with numbered step markers (Android details screen). */
    route = input<Route | null>(null);
    /** Navigation mode: the map follows every position update. */
    followUser = input(false);

    selectLocation = output<number>();

    private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
    private readonly map = signal<L.Map | null>(null);
    private readonly markers = L.layerGroup();
    private readonly markerById = new Map<number, L.Marker>();
    private userMarker: L.CircleMarker | null = null;
    private accuracyCircle: L.Circle | null = null;
    private hasInitialView = false;
    private hasCenteredOnUser = false;
    /** Set once the user pans or zooms, so late position updates never move the map under them. */
    private userMovedMap = false;
    private readonly routeLayer = L.layerGroup();

    constructor() {
        const destroyRef = inject(DestroyRef);
        let destroyed = false;
        destroyRef.onDestroy(() => (destroyed = true));

        afterNextRender(async () => {
            // Leaflet measures its panes on creation, so its CSS must be applied first
            await loadStylesheet('leaflet.css');
            if (destroyed) {
                return;
            }

            const interactive = this.interactive();
            const map = L.map(this.container().nativeElement, {
                zoomControl: false,
                attributionControl: false,
                dragging: interactive,
                touchZoom: interactive,
                scrollWheelZoom: interactive,
                doubleClickZoom: interactive,
                boxZoom: interactive,
                keyboard: interactive,
            }).setView(DEFAULT_CENTER, 13);
            L.control.attribution({ position: this.attributionPosition() }).addTo(map);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);
            if (this.zoomControl() && interactive) {
                L.control.zoom({ position: 'topright' }).addTo(map);
            }
            this.markers.addTo(map);
            this.routeLayer.addTo(map);

            const markUserMoved = () => (this.userMovedMap = true);
            map.on('dragstart', markUserMoved);
            map.getContainer().addEventListener('wheel', markUserMoved, { passive: true });
            map.getContainer().addEventListener('dblclick', markUserMoved);
            map.getContainer().querySelector('.leaflet-control-zoom')?.addEventListener('click', markUserMoved);

            // The map is laid out with CSS, so keep Leaflet in sync when its box changes
            const resizeObserver = new ResizeObserver(() => map.invalidateSize());
            resizeObserver.observe(this.container().nativeElement);

            destroyRef.onDestroy(() => {
                resizeObserver.disconnect();
                map.remove();
            });

            this.map.set(map);
        });

        effect(() => this.renderLocations(this.locations(), this.selectedId()));
        effect(() => this.renderUserPosition(this.userPosition()));
        effect(() => this.focusSelected(this.selectedId()));
        effect(() => this.renderRoute(this.route()));
    }

    /** Pans to a point at street level (a route step). */
    focusPoint(latitude: number, longitude: number): void {
        this.map()?.flyTo(this.visibleCenter([latitude, longitude], LOCATION_ZOOM), LOCATION_ZOOM);
    }

    /** Back to the selected location, as the Android remove route does. */
    centerOnSelected(): void {
        this.focusSelected(untracked(this.selectedId));
    }

    centerOnUser(): void {
        const position = this.userPosition();
        if (position) {
            this.map()?.flyTo(this.visibleCenter([position.latitude, position.longitude], LOCATION_ZOOM), LOCATION_ZOOM);
        }
    }

    /** Map center that puts `latLng` in the middle of the part not covered by `bottomInset`. */
    private visibleCenter(latLng: L.LatLngExpression, zoom: number): L.LatLng {
        const map = this.map()!;
        return map.unproject(map.project(latLng, zoom).add([0, untracked(this.bottomInset) / 2]), zoom);
    }

    private renderLocations(locations: SavedLocationWithCategory[], selectedId: number | null): void {
        const map = this.map();
        if (!map) {
            return;
        }

        this.markers.clearLayers();
        this.markerById.clear();

        for (const location of locations) {
            const marker = L.marker([location.latitude, location.longitude], {
                icon: markerIcon(location, location.id === selectedId),
                title: location.displayName,
                riseOnHover: true,
                zIndexOffset: location.id === selectedId ? 1000 : 0,
            }).on('click', () => this.selectLocation.emit(location.id));

            marker.addTo(this.markers);
            this.markerById.set(location.id, marker);
        }

        // First load: the selected location (details), otherwise the most recent one unless the map is about to center on the user
        const selected = locations.find((location) => location.id === selectedId);
        const target = selected ?? (this.userPosition() && untracked(this.centerOnUserFirstFix) ? undefined : mostRecent(locations));
        if (!this.hasInitialView && target) {
            map.setView(this.visibleCenter([target.latitude, target.longitude], LOCATION_ZOOM), LOCATION_ZOOM);
            this.hasInitialView = true;
        }
    }

    private renderUserPosition(position: Coordinates | null): void {
        const map = this.map();
        if (!map || !position) {
            return;
        }

        const latLng: L.LatLngTuple = [position.latitude, position.longitude];

        if (this.userMarker && this.accuracyCircle) {
            this.userMarker.setLatLng(latLng);
            this.accuracyCircle.setLatLng(latLng).setRadius(position.accuracy);
        } else {
            this.accuracyCircle = L.circle(latLng, { radius: position.accuracy, className: 'user-accuracy', interactive: false }).addTo(map);
            this.userMarker = L.circleMarker(latLng, { radius: 8, className: 'user-position', interactive: false }).addTo(map);
        }

        if (untracked(this.followUser)) {
            map.setView(this.visibleCenter(latLng, LOCATION_ZOOM), LOCATION_ZOOM);
            return;
        }

        // First fix: center on the user, unless they already moved the map or picked a location
        if (!this.hasCenteredOnUser) {
            this.hasCenteredOnUser = true;
            if (untracked(this.centerOnUserFirstFix) && !this.userMovedMap && untracked(this.selectedId) === null) {
                map.setView(this.visibleCenter(latLng, LOCATION_ZOOM), LOCATION_ZOOM);
                this.hasInitialView = true;
            }
        }
    }

    private renderRoute(route: Route | null): void {
        const map = this.map();
        if (!map) {
            return;
        }

        this.routeLayer.clearLayers();
        if (!route) {
            return;
        }

        const line = L.polyline(route.line, { className: 'route-line', interactive: false }).addTo(this.routeLayer);
        route.steps.forEach((step, index) => {
            L.marker([step.latitude, step.longitude], {
                icon: L.divIcon({ className: 'route-step', html: String(index + 1), iconSize: [24, 24] }),
                interactive: false,
                keyboard: false,
            }).addTo(this.routeLayer);
        });
        map.flyToBounds(line.getBounds(), { padding: [48, 48], duration: 0.35 });
    }

    private focusSelected(selectedId: number | null): void {
        const marker = selectedId === null ? undefined : this.markerById.get(selectedId);
        if (marker) {
            const zoom = Math.max(this.map()!.getZoom(), LOCATION_ZOOM);
            this.map()!.flyTo(this.visibleCenter(marker.getLatLng(), zoom), zoom);
        }
    }
}

function mostRecent(locations: SavedLocationWithCategory[]): SavedLocationWithCategory | undefined {
    return locations.reduce<SavedLocationWithCategory | undefined>((latest, location) => (!latest || (location.date ?? '') > (latest.date ?? '') ? location : latest), undefined);
}

function markerIcon(location: SavedLocationWithCategory, selected: boolean): L.DivIcon {
    // The color ends up in raw HTML, so only accept "#RRGGBB"
    const color = /^#[0-9a-f]{6}$/i.test(location.category?.color ?? '') ? location.category!.color : '#E65100';
    const icon = categoryIcon(location.category);
    const glyph = icon.type === 'icon' ? iconSvg(icon.path) : icon.type === 'emoji' ? `<span>${escapeHtml(icon.emoji)}</span>` : '';

    return L.divIcon({
        className: 'location-marker',
        html: `<div class="location-marker-pin${selected ? ' is-selected' : ''}" style="--marker-color: ${color}">${glyph}</div>`,
        // Rotated 45deg around its center, the pin tip ends 20 * sqrt(2) ≈ 28px below the center
        iconSize: [40, 40],
        iconAnchor: [20, 48],
    });
}

function iconSvg(path: string): string {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}
