/**
 * @description AWS Secrets Manager provider class for retrieving secrets from AWS
 * Manages AWS Secrets Manager client and provides methods to load and retrieve secrets
 */
declare class AWSSecretManagerProvider {
    private client;
    private secrets;
    /**
     * @description Initialize AWS Secrets Manager provider
     * Automatically initializes the Secrets Manager client on construction
     */
    constructor();
    /**
     * @description Initiate Secret Manager
     */
    initializeSecretManager(): void;
    /**
     * @description Fetch Configuration for secret Manager
     * @returns {SecretsManagerClientConfig}
     */
    private getConfiguration;
    /**
     * @description Load creds from Secret Manager
     */
    loadCreds(secretName: string): Promise<void>;
    /**
     * @description Fallback: assign secrets from a JSON object or JSON string (e.g. local dev, offline, or when AWS load fails).
     * Same shape as AWS SecretString: a flat or nested object; keys are used with get().
     * Replaces any previously loaded secrets for this instance.
     * @param {Record<string, unknown> | string} payload - Plain object or JSON string parseable to an object
     */
    setSecretsFromJson(payload: Record<string, unknown> | string): void;
    /**
     * @description Fetch Config value by key name
     * @param {string} key
     * @returns
     */
    get(key: string): any;
}
export declare const secret: AWSSecretManagerProvider;
export {};
