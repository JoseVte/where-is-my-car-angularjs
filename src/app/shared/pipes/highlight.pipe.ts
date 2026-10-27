import { Pipe, PipeTransform } from '@angular/core';

export interface TextPart {
    text: string;
    match: boolean;
}

/** Splits text around every case insensitive match of the query, to highlight it (Android LocationAdapter search). */
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
    transform(text: string | null | undefined, query: string | null | undefined): TextPart[] {
        if (!text) {
            return [];
        }

        const needle = query?.trim().toLocaleLowerCase();
        if (!needle) {
            return [{ text, match: false }];
        }

        const parts: TextPart[] = [];
        const haystack = text.toLocaleLowerCase();
        let start = 0;
        let index = haystack.indexOf(needle);

        while (index !== -1) {
            if (index > start) {
                parts.push({ text: text.slice(start, index), match: false });
            }
            parts.push({ text: text.slice(index, index + needle.length), match: true });
            start = index + needle.length;
            index = haystack.indexOf(needle, start);
        }

        if (start < text.length) {
            parts.push({ text: text.slice(start), match: false });
        }

        return parts;
    }
}
