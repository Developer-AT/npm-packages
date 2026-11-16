import { ISESTemplateDefinition } from './interface';
/**
 * @description Replace {{token}} and {{nested.key}} placeholders with data values
 * @param {string} template - Subject, HTML, or text body
 * @param {Record<string, unknown>} data - Placeholder values
 */
export declare function hydrateTemplate(template: string, data: Record<string, unknown>): string;
/**
 * @description Apply template data to a stored SES template definition
 */
export declare function hydrateDefinition(definition: ISESTemplateDefinition, data: Record<string, unknown>): ISESTemplateDefinition;
