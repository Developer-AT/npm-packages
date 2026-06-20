import { Lang } from './interface';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * @description Locales class for managing and translating locale files
 * Loads locale JSON files from a directory and provides translation functionality
 */
class Locales {
    private locales: any = {};
    
    /**
     * @description Initialize and load locale files from a directory
     * @param {string} dir - Directory path containing locale JSON files (e.g., 'en.json', 'fr.json')
     */
    public initaliseLocale(dir: string) {
        console.info(`Loading locales from: ${dir}`);
        const files = readdirSync(dir);

        files.forEach((file) => {
            if (file.endsWith('.json')) {
                const langCode = file.replace('.json', '');
                const data = readFileSync(join(dir, file), 'utf8');
                this.locales[langCode] = JSON.parse(data);
            }
        });

        console.info(`✅ Loaded locales: ${Object.keys(this.locales).join(', ')}`);
    }

    /**
     * @description Translate a key to the specified language
     * @param {string} key - Translation key to look up
     * @param {Lang} lang - Language code (default: 'en')
     * @returns {string|undefined} Translated string or undefined if key/language not found
     */
    public translate(key: string, lang: Lang = 'en') {
        const dictionary = this.locales[lang];
        if (!dictionary) return undefined;

        return this.locales[lang][key];
    }
}

export const locales = new Locales();
