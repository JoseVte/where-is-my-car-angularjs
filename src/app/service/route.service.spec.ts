import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { googleMapsDirectionsUrl, instructionKey, RouteService } from './route.service';

describe('RouteService', () => {
    let service: RouteService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(RouteService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('asks the same OSRM servers as Android, by foot or by car, and flips coordinates to lat/lon', async () => {
        const from = { latitude: 40.4168, longitude: -3.7038 };
        const to = { latitude: 40.4153, longitude: -3.6845 };
        const result = service.route(from, to, 'walk');

        http.expectOne((request) => request.url === 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/-3.7038,40.4168;-3.6845,40.4153').flush({
            code: 'Ok',
            routes: [
                {
                    distance: 1864,
                    duration: 1500,
                    geometry: { coordinates: [[-3.7038, 40.4168], [-3.6845, 40.4153]] },
                    legs: [{ steps: [{ distance: 120, name: 'Calle Mayor', maneuver: { type: 'turn', modifier: 'left', location: [-3.7, 40.41] } }] }],
                },
            ],
        });

        expect(await result).toEqual({
            origin: from,
            destination: to,
            mode: 'walk',
            line: [[40.4168, -3.7038], [40.4153, -3.6845]],
            distance: 1864,
            duration: 1500,
            steps: [{ latitude: 40.41, longitude: -3.7, distance: 120, name: 'Calle Mayor', instruction: 'web_step_left' }],
        });

        service.route(from, to, 'drive').catch(() => {});
        http.expectOne((request) => request.url.startsWith('https://routing.openstreetmap.de/routed-car/')).flush({ code: 'NoRoute' });
    });

    it('fails when OSRM finds no route', async () => {
        const result = service.route({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 }, 'walk');
        http.expectOne(() => true).flush({ code: 'NoRoute' });

        await expect(result).rejects.toThrow();
    });
});

describe('googleMapsDirectionsUrl', () => {
    it('opens the same trip in Google Maps, walking or driving', () => {
        const trip = { origin: { latitude: 40.41678, longitude: -3.70379 }, destination: { latitude: 40.4153, longitude: -3.7074 } };

        expect(googleMapsDirectionsUrl({ ...trip, mode: 'walk' })).toBe(
            'https://www.google.com/maps/dir/?api=1&origin=40.41678%2C-3.70379&destination=40.4153%2C-3.7074&travelmode=walking',
        );
        expect(googleMapsDirectionsUrl({ ...trip, mode: 'drive' })).toContain('travelmode=driving');
    });
});

describe('instructionKey', () => {
    it('maps OSRM maneuvers to translation keys', () => {
        expect(instructionKey('depart', 'right')).toBe('web_step_depart');
        expect(instructionKey('arrive', undefined)).toBe('web_step_arrive');
        expect(instructionKey('roundabout', 'right')).toBe('web_step_roundabout');
        expect(instructionKey('turn', 'sharp left')).toBe('web_step_sharp_left');
        expect(instructionKey('end of road', 'slight right')).toBe('web_step_slight_right');
        expect(instructionKey('continue', 'straight')).toBe('step_continue');
    });
});
