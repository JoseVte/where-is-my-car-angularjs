import { displayNameOrFallback } from './edit-location';

describe('displayNameOrFallback', () => {
    const location = { address: 'Sol, Madrid', latitude: 40.415321, longitude: -3.707412 };

    it('keeps the typed name, trimmed', () => {
        expect(displayNameOrFallback('  Parking  ', location)).toBe('Parking');
    });

    it('falls back to the address, then to the coordinates, like the Android ApiMappers', () => {
        expect(displayNameOrFallback('   ', location)).toBe('Sol, Madrid');
        expect(displayNameOrFallback('', { ...location, address: null })).toBe('40.41532, -3.70741');
    });

    it('never goes over the API limit of 100 characters', () => {
        expect(displayNameOrFallback('a'.repeat(150), location)).toHaveLength(100);
    });
});
