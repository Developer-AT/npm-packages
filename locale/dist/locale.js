"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locales = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * @description Locales class for managing and translating locale files
 * Loads locale JSON files from a directory and provides translation functionality
 */
class Locales {
    locales = {};
    /**
     * @description Initialize and load locale files from a directory
     * @param {string} dir - Directory path containing locale JSON files (e.g., 'en.json', 'fr.json')
     */
    initaliseLocale(dir) {
        console.info(`Loading locales from: ${dir}`);
        const files = (0, fs_1.readdirSync)(dir);
        files.forEach((file) => {
            if (file.endsWith('.json')) {
                const langCode = file.replace('.json', '');
                const data = (0, fs_1.readFileSync)((0, path_1.join)(dir, file), 'utf8');
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
    translate(key, lang = 'en') {
        const dictionary = this.locales[lang];
        if (!dictionary)
            return undefined;
        return this.locales[lang][key];
    }
}
exports.locales = new Locales();
//# sourceMappingURL=locale.js.map