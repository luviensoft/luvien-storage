import { DynamicModule } from '@nestjs/common';
import type { InjectionToken, OptionalFactoryDependency } from '@nestjs/common';
import type { StorageScopeConfig } from '../core/domain/scope.js';
import type { S3StorageConfig } from '../adapters/s3/s3.config.js';
import type { LocalStorageConfig } from '../adapters/local/local.storage.js';
export type StorageDriverConfig = {
    driver: 's3';
    s3: S3StorageConfig;
} | {
    driver: 'local';
    local: LocalStorageConfig;
};
export interface StorageModuleOptions {
    driver: StorageDriverConfig;
    scope?: StorageScopeConfig;
}
export interface StorageModuleAsyncOptions<TArgs extends unknown[] = any[]> {
    imports?: unknown[];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: TArgs) => Promise<StorageModuleOptions> | StorageModuleOptions;
}
export declare class StorageModule {
    static forRoot(options: StorageModuleOptions): DynamicModule;
    static forRootAsync<TArgs extends unknown[]>(options: StorageModuleAsyncOptions<TArgs>): DynamicModule;
}
//# sourceMappingURL=storage.module.d.ts.map