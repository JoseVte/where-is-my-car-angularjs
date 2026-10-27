import { emojiShortcutKey, iconChoice, iconValue, isSingleEmoji, presetColorName, SUGGESTED_EMOJIS } from './category-form';

describe('category form', () => {
    it('reads every stored icon format', () => {
        expect(iconChoice('@drawable/ic_home')).toEqual({ kind: 'icon', name: 'home' });
        expect(iconChoice('home')).toEqual({ kind: 'icon', name: 'home' });
        expect(iconChoice('@drawable/ic_forbidden')).toEqual({ kind: 'none' });
        expect(iconChoice('🚗')).toEqual({ kind: 'emoji', emoji: '🚗' });
    });

    it('stores icons the way the Android app does', () => {
        expect(iconValue({ kind: 'icon', name: 'coffee' })).toBe('@drawable/ic_coffee');
        expect(iconValue({ kind: 'none' })).toBe('@drawable/ic_forbidden');
        expect(iconValue({ kind: 'emoji', emoji: '🍩' })).toBe('🍩');
    });

    it('accepts exactly one emoji, including composed ones', () => {
        expect(isSingleEmoji('🚗')).toBe(true);
        expect(isSingleEmoji(' 👩‍💻 ')).toBe(true);
        expect(isSingleEmoji('🇪🇸')).toBe(true);
        expect(isSingleEmoji('🚗🚕')).toBe(false);
        expect(isSingleEmoji('a')).toBe(false);
        expect(isSingleEmoji('!')).toBe(false);
        expect(isSingleEmoji('')).toBe(false);
    });

    it('offers only suggestions the emoji validation accepts', () => {
        expect(SUGGESTED_EMOJIS.filter((emoji) => !isSingleEmoji(emoji))).toEqual([]);
        expect(new Set(SUGGESTED_EMOJIS).size).toBe(SUGGESTED_EMOJIS.length);
    });

    it('suggests the system emoji picker shortcut on computers only', () => {
        expect(emojiShortcutKey('macOS', false)).toBe('web_emoji_shortcut_mac');
        expect(emojiShortcutKey('MacIntel', false)).toBe('web_emoji_shortcut_mac');
        expect(emojiShortcutKey('Windows', false)).toBe('web_emoji_shortcut_windows');
        expect(emojiShortcutKey('Win32', false)).toBe('web_emoji_shortcut_windows');
        expect(emojiShortcutKey('Linux x86_64', false)).toBeNull();
        expect(emojiShortcutKey('macOS', true)).toBeNull();
    });

    it('names the Android preset colors, ignoring case', () => {
        expect(presetColorName('#e65100')).toBe('color_warm_orange');
        expect(presetColorName('#FFB300')).toBe('color_amber');
        expect(presetColorName('#123456')).toBeNull();
    });
});
