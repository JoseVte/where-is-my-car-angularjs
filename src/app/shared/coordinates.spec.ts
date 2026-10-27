import { I18n } from '../i18n/i18n';
import { formatAddress, formatCoordinates } from './coordinates';

const i18n = { t: (key: string) => ({ north_char: 'N', south_char: 'S', east_char: 'E', wester_char: 'O' })[key] ?? key } as I18n;

describe('coordinates', () => {
    it('formats like the Android coords_format, absolute values and cardinal letters', () => {
        expect(formatCoordinates(40.41532, -3.70741, i18n)).toBe('40.4153° N, 3.7074° O');
        expect(formatCoordinates(-33.8688, 151.2093, i18n)).toBe('33.8688° S, 151.2093° E');
    });

    it('falls back to city and country like address_format', () => {
        expect(formatAddress('Calle Mayor 1', 'Madrid', 'España')).toBe('Calle Mayor 1');
        expect(formatAddress(null, 'Madrid', 'España')).toBe('Madrid, España');
        expect(formatAddress('', null, 'España')).toBe('España');
    });
});
