import { SecretsManagerClient, SecretsManagerClientConfig, GetSecretValueCommand, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { SecretsManagerException } from './exception-handler';

/**
 * @description AWS Secrets Manager provider class for retrieving secrets from AWS
 * Manages AWS Secrets Manager client and provides methods to load and retrieve secrets
 */
class AWSSecretManagerProvider {
    private client: SecretsManagerClient;
    private secrets: any;

    /**
     * @description Initialize AWS Secrets Manager provider
     * Automatically initializes the Secrets Manager client on construction
     */
    constructor() {
        this.initializeSecretManager();
    }

    /**
     * @description Initiate Secret Manager
     */
    public initializeSecretManager() {
        try {
            this.client = new SecretsManagerClient(this.getConfiguration());
        } catch (error) {
            console.info('Unable to Connect Error::', error);
            throw new SecretsManagerException(error, { operation: 'initializeSecretManager' }).getError();
        }
    }

    /**
     * @description Fetch Configuration for secret Manager
     * @returns {SecretsManagerClientConfig}
     */
    private getConfiguration(): SecretsManagerClientConfig {
        const creds: SecretsManagerClientConfig = {};
        creds.region = <string>process.env.AWS_REGION;

        return creds;
    }

    /**
     * @description Load creds from Secret Manager
     */
    async loadCreds(secretName: string) {
        try {
            const loadSecret: GetSecretValueCommandOutput = await this.client.send(
                new GetSecretValueCommand({
                    SecretId: secretName
                })
            );

            this.secrets = JSON.parse(<string>loadSecret.SecretString);
        } catch (error: any) {
            console.error(`Unable to Load credentials AWS Error `, error);
            throw new SecretsManagerException(error, { 
                operation: 'loadCreds',
                secretName 
            }).getError();
        }
    }

    /**
     * @description Fallback: assign secrets from a JSON object or JSON string (e.g. local dev, offline, or when AWS load fails).
     * Same shape as AWS SecretString: a flat or nested object; keys are used with get().
     * Replaces any previously loaded secrets for this instance.
     * @param {Record<string, unknown> | string} payload - Plain object or JSON string parseable to an object
     */
    setSecretsFromJson(payload: Record<string, unknown> | string): void {
        if (typeof payload === 'string') {
            try {
                const parsed = JSON.parse(payload) as unknown;
                if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('Secrets JSON must be a non-null object (not an array or primitive)');
                }
                this.secrets = parsed as Record<string, unknown>;
            } catch (error: unknown) {
                console.error('setSecretsFromJson: invalid JSON', error);
                throw new SecretsManagerException(error, { operation: 'setSecretsFromJson' }).getError();
            }
        } else {
            this.secrets = { ...payload };
        }
    }

    /**
     * @description Fetch Config value by key name
     * @param {string} key
     * @returns
     */
    get(key: string) {
        return this.secrets?.[key];
    }
}

export const secret = new AWSSecretManagerProvider();
