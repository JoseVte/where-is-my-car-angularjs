import { reducedIconName } from '../../shared/components/category-icon/category-icon.util';
import { NO_ICON, PICKER_ICONS } from '../../shared/components/category-icon/category-icons';

/** Android EditCategoryFragment label field. */
export const LABEL_MAX_LENGTH = 32;

/** Android preset colors (EditCategoryFragment.colors) with their name keys. Custom colors are any other "#RRGGBB". */
export const PRESET_COLORS = [
    { hex: '#E65100', name: 'color_warm_orange' },
    { hex: '#795548', name: 'color_brown' },
    { hex: '#8D6E63', name: 'color_tan' },
    { hex: '#BF360C', name: 'color_deep_orange' },
    { hex: '#5D4037', name: 'color_dark_brown' },
    { hex: '#FFB300', name: 'color_amber' },
    { hex: '#F4511E', name: 'color_sunset' },
] as const;

export const DEFAULT_COLOR = PRESET_COLORS[0].hex;

/** Android meant ic_favorite as the default (it stores the text "favorite" by mistake). */
export const DEFAULT_ICON = '@drawable/ic_favorite';

/** What the icon grid has selected. */
export type IconChoice = { kind: 'none' } | { kind: 'icon'; name: string } | { kind: 'emoji'; emoji: string };

/** Stored icon value (Android format) to the grid selection. */
export function iconChoice(icon: string): IconChoice {
    const name = reducedIconName(icon);
    if (name === null) {
        return icon ? { kind: 'emoji', emoji: icon } : { kind: 'none' };
    }
    if (name === NO_ICON) {
        return { kind: 'none' };
    }
    return { kind: 'icon', name };
}

/** Grid selection to the value the Android app stores: "@drawable/ic_<name>", the raw emoji or "@drawable/ic_forbidden". */
export function iconValue(choice: IconChoice): string {
    switch (choice.kind) {
        case 'none':
            return `@drawable/ic_${NO_ICON}`;
        case 'emoji':
            return choice.emoji;
        case 'icon':
            return `@drawable/ic_${choice.name}`;
    }
}

export function isPickerIcon(name: string): name is (typeof PICKER_ICONS)[number] {
    return (PICKER_ICONS as readonly string[]).includes(name);
}

/** Suggestions for places, so the emoji can be picked without an emoji keyboard (desktop). */
export const SUGGESTED_EMOJIS = [
    '🚗', '🅿️', '⛽', '🚲', '🛵', '🚌', '🚆', '✈️',
    '🏠', '🏢', '🏫', '🏥', '🏨', '⛪', '🏛️', '🏟️',
    '🛒', '☕', '🍽️', '🍕', '🍔', '🍺', '🍦', '🥐',
    '🏋️', '⚽', '🎾', '🏊', '🎬', '🎭', '🎮', '🎸',
    '🌳', '🏖️', '⛰️', '🏕️', '🐶', '❤️', '⭐', '📍',
];

/** Translation key with the system emoji picker shortcut, or null where there is none to suggest (phones). */
export function emojiShortcutKey(platform: string, isTouch: boolean): string | null {
    if (isTouch) {
        return null;
    }
    if (/mac/i.test(platform)) {
        return 'web_emoji_shortcut_mac';
    }
    if (/win/i.test(platform)) {
        return 'web_emoji_shortcut_windows';
    }
    return null;
}

/** Exactly one emoji (one grapheme with a pictographic character), stricter than the Android input filter. */
export function isSingleEmoji(value: string): boolean {
    const text = value.trim();
    if (!text || text.length > 16) {
        return false;
    }
    const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)];
    return graphemes.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(text);
}

/** Preset name key for a color, or null when it is a custom one. */
export function presetColorName(color: string): string | null {
    return PRESET_COLORS.find(({ hex }) => hex.toLowerCase() === color.toLowerCase())?.name ?? null;
}
