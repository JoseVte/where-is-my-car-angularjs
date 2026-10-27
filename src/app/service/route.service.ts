import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Android OSRMRoadManager means: MEAN_BY_FOOT and MEAN_BY_CAR. */
export type TravelMode = 'walk' | 'drive';

export interface RouteStep {
    latitude: number;
    longitude: number;
    /** Meters until the next step. */
    distance: number;
    /** Translation key of the maneuver. */
    instruction: string;
    /** Street name, empty when OSRM has none. */
    name: string;
}

export interface LatLon {
    latitude: number;
    longitude: number;
}

export interface Route {
    origin: LatLon;
    destination: LatLon;
    mode: TravelMode;
    /** [latitude, longitude] points of the line. */
    line: [number, number][];
    /** Meters. */
    distance: number;
    /** Seconds. */
    duration: number;
    steps: RouteStep[];
}

interface OsrmStep {
    distance: number;
    name: string;
    maneuver: { type: string; modifier?: string; location: [number, number] };
}

interface OsrmResponse {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { steps: OsrmStep[] }[] }[];
}

/** Same OSRM servers as the Android app (osmbonuspack OSRMRoadManager, FOSSGIS). */
const SERVERS: Record<TravelMode, string> = {
    walk: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
    drive: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
};

@Service()
export class RouteService {
    private readonly http = inject(HttpClient);

    async route(from: LatLon, to: LatLon, mode: TravelMode): Promise<Route> {
        const points = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
        const response = await firstValueFrom(
            this.http.get<OsrmResponse>(`${SERVERS[mode]}/${points}`, { params: { overview: 'full', geometries: 'geojson', steps: true } }),
        );

        const route = response.routes?.[0];
        if (response.code !== 'Ok' || !route) {
            throw new Error(`No route: ${response.code}`);
        }

        return {
            origin: { latitude: from.latitude, longitude: from.longitude },
            destination: { latitude: to.latitude, longitude: to.longitude },
            mode,
            line: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
            distance: route.distance,
            duration: route.duration,
            steps: route.legs.flatMap((leg) => leg.steps).map(toStep),
        };
    }
}

/** Google Maps directions URL for the same trip (opens the Google Maps app on phones). */
export function googleMapsDirectionsUrl({ origin, destination, mode }: Pick<Route, 'origin' | 'destination' | 'mode'>): string {
    const params = new URLSearchParams({
        api: '1',
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        travelmode: mode === 'walk' ? 'walking' : 'driving',
    });
    return `https://www.google.com/maps/dir/?${params}`;
}

function toStep({ distance, name, maneuver }: OsrmStep): RouteStep {
    const [longitude, latitude] = maneuver.location;
    return { latitude, longitude, distance, name, instruction: instructionKey(maneuver.type, maneuver.modifier) };
}

/** OSRM gives the maneuver type and direction, not a text: map them to the web_step_* strings. */
export function instructionKey(type: string, modifier: string | undefined): string {
    switch (type) {
        case 'depart':
            return 'web_step_depart';
        case 'arrive':
            return 'web_step_arrive';
        case 'roundabout':
        case 'rotary':
        case 'roundabout turn':
            return 'web_step_roundabout';
    }

    switch (modifier) {
        case 'left':
            return 'web_step_left';
        case 'right':
            return 'web_step_right';
        case 'slight left':
            return 'web_step_slight_left';
        case 'slight right':
            return 'web_step_slight_right';
        case 'sharp left':
            return 'web_step_sharp_left';
        case 'sharp right':
            return 'web_step_sharp_right';
        case 'uturn':
            return 'web_step_uturn';
        default:
            return 'step_continue';
    }
}
