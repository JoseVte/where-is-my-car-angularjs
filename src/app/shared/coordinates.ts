import { I18n } from '../i18n/i18n';

/**
 * Android coords_format ("%1$s° %2$s, %3$s° %4$s", not translatable): absolute values with 4 decimals
 * and the translated cardinal letters, "40.4153° N, 3.7074° O" in Spanish.
 */
export function formatCoordinates(latitude: number, longitude: number, i18n: I18n): string {
    const latitudeLetter = i18n.t(latitude >= 0 ? 'north_char' : 'south_char');
    const longitudeLetter = i18n.t(longitude >= 0 ? 'east_char' : 'wester_char');

    return `${Math.abs(latitude).toFixed(4)}° ${latitudeLetter}, ${Math.abs(longitude).toFixed(4)}° ${longitudeLetter}`;
}

/** Android address_format ("%1$s, %2$s", not translatable): city and country when there is no address. */
export function formatAddress(address: string | null | undefined, city: string | null | undefined, country: string | null | undefined): string {
    return address || [city, country].filter(Boolean).join(', ');
}
