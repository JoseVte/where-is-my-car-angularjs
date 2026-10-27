const WHITE = '#FFFFFF';
/** Android text_primary (light theme). */
const DARK = '#2C1B00';
const BLACK = '#000000';

function luminance(hex: string): number {
    const channel = (offset: number) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Text color for a "#RRGGBB" background: white like Android, else the dark text color, else black.
 * One of white and black always reaches 4.5:1, mid tones like #E91E63 only with black.
 */
export function readableTextOn(background: string): string {
    if (!/^#[0-9a-f]{6}$/i.test(background)) {
        return WHITE;
    }

    return [WHITE, DARK, BLACK].find((text) => contrast(text, background) >= 4.5) ?? BLACK;
}
