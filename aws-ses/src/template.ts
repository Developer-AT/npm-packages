import { ISESTemplateDefinition } from './interface';

/**
 * @description Replace {{token}} and {{nested.key}} placeholders with data values
 * @param {string} template - Subject, HTML, or text body
 * @param {Record<string, unknown>} data - Placeholder values
 */
export function hydrateTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, token: string) => {
        const value = resolvePath(data, token);
        return value === undefined || value === null ? '' : String(value);
    });
}

/**
 * @description Apply template data to a stored SES template definition
 */
export function hydrateDefinition(
    definition: ISESTemplateDefinition,
    data: Record<string, unknown>
): ISESTemplateDefinition {
    return {
        templateName: definition.templateName,
        subject: hydrateTemplate(definition.subject || '', data),
        html: definition.html ? hydrateTemplate(definition.html, data) : undefined,
        text: definition.text ? hydrateTemplate(definition.text, data) : undefined
    };
}

function resolvePath(data: Record<string, unknown>, token: string): unknown {
    return token.split('.').reduce<unknown>((current, key) => {
        if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
            return (current as Record<string, unknown>)[key];
        }
        return undefined;
    }, data);
}
