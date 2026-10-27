import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Coordinates {
    latitude: number;
    longitude: number;
    /** Meters. */
    accuracy: number;
}

export interface ReverseGeocodedAddress {
    displayName: string;
    address: string;
    city: string;
    country: string;
    addressData: Record<string, string>;
}

/** Raised when the browser cannot give a position. `reason` tells the UI which message to show. */
export class GeolocationError extends Error {
    constructor(readonly reason: 'unsupported' | 'denied' | 'unavailable' | 'timeout') {
        super(`Geolocation failed: ${reason}`);
    }
}

interface NominatimResponse {
    display_name?: string;
    name?: string;
    address?: Record<string, string>;
}

@Service()
export class GeolocationService {
    private readonly http = inject(HttpClient);

    /** The first call shows the browser permission prompt. */
    getCurrentPosition(): Promise<Coordinates> {
        if (!('geolocation' in navigator)) {
            return Promise.reject(new GeolocationError('unsupported'));
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
                (error) => reject(new GeolocationError(positionErrorReason(error))),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
        });
    }

    /** Calls `onChange` on every position update until the returned function is called. */
    watchPosition(onChange: (coordinates: Coordinates) => void, onError: (error: GeolocationError) => void): () => void {
        if (!('geolocation' in navigator)) {
            onError(new GeolocationError('unsupported'));
            return () => {};
        }

        const watchId = navigator.geolocation.watchPosition(
            ({ coords }) => onChange({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
            (error) => onError(new GeolocationError(positionErrorReason(error))),
            { enableHighAccuracy: true },
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }

    /**
     * Address for the coordinates using Nominatim (OpenStreetMap), the same geocoder the Android app uses.
     * Returns null when nothing is found or the service fails, so saving never depends on it.
     */
    async reverseGeocode({ latitude, longitude }: Pick<Coordinates, 'latitude' | 'longitude'>): Promise<ReverseGeocodedAddress | null> {
        try {
            const response = await firstValueFrom(
                this.http.get<NominatimResponse>('https://nominatim.openstreetmap.org/reverse', {
                    params: { format: 'jsonv2', lat: latitude, lon: longitude, addressdetails: 1 },
                }),
            );

            return response.display_name ? toAddress(response, latitude, longitude) : null;
        } catch {
            return null;
        }
    }
}

function positionErrorReason(error: GeolocationPositionError): GeolocationError['reason'] {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'denied';
        case error.TIMEOUT:
            return 'timeout';
        default:
            return 'unavailable';
    }
}

function toAddress(response: NominatimResponse, latitude: number, longitude: number): ReverseGeocodedAddress {
    const parts = response.address ?? {};
    const street = [parts['road'], parts['house_number']].filter(Boolean).join(' ');
    const city = parts['city'] ?? parts['town'] ?? parts['village'] ?? parts['municipality'] ?? '';

    // Like the Android app: the first line is the name and the rest of the lines are the address
    const lines = (response.display_name ?? '').split(',').map((line) => line.trim());
    const displayName = response.name || street || lines[0];
    const address = lines.filter((line) => line !== displayName).join(', ');

    // Same keys the Android app stores (android.location.Address getters)
    const addressData: Record<string, string> = {
        'Address Line 0': displayName,
        'Feature Name': response.name || street,
        Thoroughfare: parts['road'] ?? '',
        'Sub Thoroughfare': parts['house_number'] ?? '',
        Locality: city,
        'Sub Locality': parts['suburb'] ?? parts['neighbourhood'] ?? '',
        'Sub Admin Area': parts['county'] ?? '',
        'Admin Area': parts['state'] ?? '',
        'Postal Code': parts['postcode'] ?? '',
        'Country Code': (parts['country_code'] ?? '').toUpperCase(),
        'Country Name': parts['country'] ?? '',
        Latitude: String(latitude),
        Longitude: String(longitude),
    };

    return {
        displayName,
        address,
        city,
        country: parts['country'] ?? '',
        addressData: Object.fromEntries(Object.entries(addressData).filter(([, value]) => value !== '')),
    };
}
