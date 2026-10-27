// Imports the Android app translations (res/values*/strings.xml) into src/i18n/android.<lang>.json.
// Keys and placeholders (%1$s, %d...) are kept as in Android so both apps can be kept in sync.
//
// Usage: node scripts/import-android-strings.mjs <path to the WhereIsMyCar Android project>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LANGUAGES = { en: 'values', es: 'values-es' };

const androidProject = process.argv[2];
if (!androidProject) {
    console.error('Usage: node scripts/import-android-strings.mjs <path to the Android project>');
    process.exit(1);
}

const resources = join(androidProject, 'app/src/main/res');
const outputDir = new URL('../src/i18n/', import.meta.url);

for (const [language, folder] of Object.entries(LANGUAGES)) {
    const xml = readFileSync(join(resources, folder, 'strings.xml'), 'utf8');
    const strings = {};

    for (const [, attributes, value] of xml.matchAll(/<string\s+([^>]*?)>([\s\S]*?)<\/string>/g)) {
        if (/translatable="false"/.test(attributes)) {
            continue;
        }

        strings[attributes.match(/name="([^"]+)"/)[1]] = unescapeAndroid(value);
    }

    const sorted = Object.fromEntries(Object.entries(strings).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(new URL(`android.${language}.json`, outputDir), `${JSON.stringify(sorted, null, 4)}\n`);
    console.log(`${language}: ${Object.keys(sorted).length} strings`);
}

/** Android string resource rules: optional surrounding quotes, backslash escapes and XML entities. Tags are dropped. */
function unescapeAndroid(raw) {
    let value = raw.trim();

    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
    } else {
        value = value.replace(/\s+/g, ' ');
    }

    return value
        .replace(/<[^>]+>/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\(['"@?\\])/g, '$1')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&amp;/g, '&');
}
