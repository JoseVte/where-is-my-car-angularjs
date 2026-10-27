import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
    let service: GeolocationService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(GeolocationService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('maps a Nominatim address to the fields the Android app stores', async () => {
        const result = service.reverseGeocode({ latitude: 40.4155, longitude: -3.7074 });

        http.expectOne((request) => request.url === 'https://nominatim.openstreetmap.org/reverse' && request.params.get('lat') === '40.4155').flush({
            display_name: 'Calle Mayor 1, Sol, Centro, Madrid, Comunidad de Madrid, 28013, España',
            name: '',
            address: {
                road: 'Calle Mayor',
                house_number: '1',
                suburb: 'Sol',
                city: 'Madrid',
                state: 'Comunidad de Madrid',
                postcode: '28013',
                country: 'España',
                country_code: 'es',
            },
        });

        expect(await result).toEqual({
            displayName: 'Calle Mayor 1',
            address: 'Sol, Centro, Madrid, Comunidad de Madrid, 28013, España',
            city: 'Madrid',
            country: 'España',
            addressData: {
                'Address Line 0': 'Calle Mayor 1',
                'Feature Name': 'Calle Mayor 1',
                Thoroughfare: 'Calle Mayor',
                'Sub Thoroughfare': '1',
                Locality: 'Madrid',
                'Sub Locality': 'Sol',
                'Admin Area': 'Comunidad de Madrid',
                'Postal Code': '28013',
                'Country Code': 'ES',
                'Country Name': 'España',
                Latitude: '40.4155',
                Longitude: '-3.7074',
            },
        });
    });

    it('returns null when Nominatim fails, so saving does not depend on it', async () => {
        const result = service.reverseGeocode({ latitude: 0, longitude: 0 });

        http.expectOne(() => true).flush('error', { status: 500, statusText: 'Server Error' });

        expect(await result).toBeNull();
    });

    it('returns null when there is no address for the point', async () => {
        const result = service.reverseGeocode({ latitude: 0, longitude: 0 });

        http.expectOne(() => true).flush({ error: 'Unable to geocode' });

        expect(await result).toBeNull();
    });
});
