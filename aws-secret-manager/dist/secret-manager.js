"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secret = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const exception_handler_1 = require("./exception-handler");
/**
 * @description AWS Secrets Manager provider class for retrieving secrets from AWS
 * Manages AWS Secrets Manager client and provides methods to load and retrieve secrets
 */
class AWSSecretManagerProvider {
    client;
    secrets;
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
    initializeSecretManager() {
        try {
            this.client = new client_secrets_manager_1.SecretsManagerClient(this.getConfiguration());
        }
        catch (error) {
            console.info('Unable to Connect Error::', error);
            throw new exception_handler_1.SecretsManagerException(error, { operation: 'initializeSecretManager' }).getError();
        }
    }
    /**
     * @description Fetch Configuration for secret Manager
     * @returns {SecretsManagerClientConfig}
     */
    getConfiguration() {
        const creds = {};
        creds.region = process.env.AWS_REGION;
        return creds;
    }
    /**
     * @description Load creds from Secret Manager
     */
    async loadCreds(secretName) {
        try {
            const loadSecret = await this.client.send(new client_secrets_manager_1.GetSecretValueCommand({
                SecretId: secretName
            }));
            this.secrets = JSON.parse(loadSecret.SecretString);
        }
        catch (error) {
            console.error(`Unable to Load credentials AWS Error `, error);
            throw new exception_handler_1.SecretsManagerException(error, {
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
    setSecretsFromJson(payload) {
        if (typeof payload === 'string') {
            try {
                const parsed = JSON.parse(payload);
                if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('Secrets JSON must be a non-null object (not an array or primitive)');
                }
                this.secrets = parsed;
            }
            catch (error) {
                console.error('setSecretsFromJson: invalid JSON', error);
                throw new exception_handler_1.SecretsManagerException(error, { operation: 'setSecretsFromJson' }).getError();
            }
        }
        else {
            this.secrets = { ...payload };
        }
    }
    /**
     * @description Fetch Config value by key name
     * @param {string} key
     * @returns
     */
    get(key) {
        return this.secrets?.[key];
    }
}
exports.secret = new AWSSecretManagerProvider();
//# sourceMappingURL=secret-manager.js.map