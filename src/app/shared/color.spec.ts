import { readableTextOn } from './color';

describe('readableTextOn', () => {
    it('keeps white text, like Android, when it reaches 4.5:1', () => {
        expect(readableTextOn('#B33A00')).toBe('#FFFFFF');
        expect(readableTextOn('#795548')).toBe('#FFFFFF');
    });

    it('switches to dark text on light colors', () => {
        expect(readableTextOn('#FFC107')).toBe('#2C1B00');
    });

    it('falls back to black on mid tones where neither white nor the dark text reach 4.5:1', () => {
        expect(readableTextOn('#E91E63')).toBe('#000000');
        expect(readableTextOn('#E65100')).toBe('#000000');
    });
});
