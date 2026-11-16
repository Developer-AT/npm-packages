"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrateTemplate = hydrateTemplate;
exports.hydrateDefinition = hydrateDefinition;
/**
 * @description Replace {{token}} and {{nested.key}} placeholders with data values
 * @param {string} template - Subject, HTML, or text body
 * @param {Record<string, unknown>} data - Placeholder values
 */
function hydrateTemplate(template, data) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, token) => {
        const value = resolvePath(data, token);
        return value === undefined || value === null ? '' : String(value);
    });
}
/**
 * @description Apply template data to a stored SES template definition
 */
function hydrateDefinition(definition, data) {
    return {
        templateName: definition.templateName,
        subject: hydrateTemplate(definition.subject || '', data),
        html: definition.html ? hydrateTemplate(definition.html, data) : undefined,
        text: definition.text ? hydrateTemplate(definition.text, data) : undefined
    };
}
function resolvePath(data, token) {
    return token.split('.').reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return current[key];
        }
        return undefined;
    }, data);
}
//# sourceMappingURL=template.js.map