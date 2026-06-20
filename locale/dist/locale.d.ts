import { Lang } from './interface';
/**
 * @description Locales class for managing and translating locale files
 * Loads locale JSON files from a directory and provides translation functionality
 */
declare class Locales {
    private locales;
    /**
     * @description Initialize and load locale files from a directory
     * @param {string} dir - Directory path containing locale JSON files (e.g., 'en.json', 'fr.json')
     */
    initaliseLocale(dir: string): void;
    /**
     * @description Translate a key to the specified language
     * @param {string} key - Translation key to look up
     * @param {Lang} lang - Language code (default: 'en')
     * @returns {string|undefined} Translated string or undefined if key/language not found
     */
    translate(key: string, lang?: Lang): any;
}
export declare const locales: Locales;
export {};
