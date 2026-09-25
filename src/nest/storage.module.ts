import { DynamicModule, Module, type Provider } from '@nestjs/common';
import type { InjectionToken, OptionalFactoryDependency } from '@nestjs/common';

import { STORAGE, type Storage } from '../core/port/storage.port.js';
import {
  SCOPE_CONTEXT,
  ScopeContext,
} from '../core/port/scope-context.port.js';
import {
  SCOPE_STRATEGY,
  type ScopeStrategy,
} from '../core/port/scope-strategy.port.js';
import { PrefixScopeStrategy } from '../core/domain/prefix-scope-strategy.js';
import type { StorageScopeConfig } from '../core/domain/scope.js';

import { S3Storage } from '../adapters/s3/s3.storage.js';
import type { S3StorageConfig } from '../adapters/s3/s3.config.js';
import { LocalStorage } from '../adapters/local/local.storage.js';
import type { LocalStorageConfig } from '../adapters/local/local.storage.js';

import { StorageService } from './storage.service.js';

export type StorageDriverConfig =
  | { driver: 's3'; s3: S3StorageConfig }
  | { driver: 'local'; local: LocalStorageConfig };

export interface StorageModuleOptions {
  driver: StorageDriverConfig;
  scope?: StorageScopeConfig;
}

export interface StorageModuleAsyncOptions<TArgs extends unknown[] = any[]> {
  imports?: unknown[];
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: TArgs
  ) => Promise<StorageModuleOptions> | StorageModuleOptions;
}

@Module({})
export class StorageModule {
  static forRoot(options: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      providers: buildProviders(options),
      exports: [STORAGE, SCOPE_CONTEXT, SCOPE_STRATEGY, StorageService],
    };
  }

  static forRootAsync<TArgs extends unknown[]>(
    options: StorageModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    const configProvider: Provider = {
      provide: 'luvien:storage:options',
      useFactory: options.useFactory as (...args: unknown[]) => unknown,
      inject: (options.inject ?? []) as never[],
    };

    return {
      module: StorageModule,
      global: true,
      imports: (options.imports ?? []) as never[],
      providers: [configProvider, ...buildProvidersFromConfig()],
      exports: [STORAGE, SCOPE_CONTEXT, SCOPE_STRATEGY, StorageService],
    };
  }
}

function buildProviders(options: StorageModuleOptions): Provider[] {
  return [
    { provide: 'luvien:storage:options', useValue: options },
    ...buildProvidersFromConfig(),
  ];
}

function buildProvidersFromConfig(): Provider[] {
  return [
    {
      provide: SCOPE_CONTEXT,
      useFactory: () => new ScopeContext(),
    },
    {
      provide: SCOPE_STRATEGY,
      useFactory: (options: StorageModuleOptions): ScopeStrategy =>
        new PrefixScopeStrategy(options.scope),
      inject: ['luvien:storage:options'],
    },
    {
      provide: STORAGE,
      useFactory: (
        options: StorageModuleOptions,
        scopeStrategy: ScopeStrategy,
        scopeContext: ScopeContext,
      ): Storage => {
        switch (options.driver.driver) {
          case 's3':
            return new S3Storage(
              options.driver.s3,
              scopeStrategy,
              scopeContext,
            );
          case 'local':
            return new LocalStorage(
              options.driver.local,
              scopeStrategy,
              scopeContext,
            );
        }
      },
      inject: ['luvien:storage:options', SCOPE_STRATEGY, SCOPE_CONTEXT],
    },
    StorageService,
  ];
}
