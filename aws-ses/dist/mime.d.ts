import { ISESSendMailOptions } from './interface';
/**
 * @description Build an RFC822 message buffer for SES Content.Raw
 */
export declare function buildRawMessage(options: ISESSendMailOptions & {
    from: string;
}): Promise<Buffer>;
