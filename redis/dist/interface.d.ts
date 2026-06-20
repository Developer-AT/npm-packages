import { ConnectionOptions } from "tls";
export type REDIS_CLUSTER_TYPE = 'READ' | 'WRITE';
export interface IRedisConfig {
    readReplicaHost: string;
    readReplicaPort: number;
    writeReplicaHost: string;
    writeReplicaPort: number;
    password?: string;
    db?: number;
    isTlsEnabled?: boolean;
    tlsOptions?: ConnectionOptions;
}
