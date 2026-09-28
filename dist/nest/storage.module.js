var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StorageModule_1;
import { Module } from '@nestjs/common';
import { STORAGE } from '../core/port/storage.port.js';
import { SCOPE_CONTEXT, ScopeContext, } from '../core/port/scope-context.port.js';
import { SCOPE_STRATEGY, } from '../core/port/scope-strategy.port.js';
import { PrefixScopeStrategy } from '../core/domain/prefix-scope-strategy.js';
import { S3Storage } from '../adapters/s3/s3.storage.js';
import { LocalStorage } from '../adapters/local/local.storage.js';
import { StorageService } from './storage.service.js';
let StorageModule = StorageModule_1 = class StorageModule {
    static forRoot(options) {
        return {
            module: StorageModule_1,
            global: true,
            providers: buildProviders(options),
            exports: [STORAGE, SCOPE_CONTEXT, SCOPE_STRATEGY, StorageService],
        };
    }
    static forRootAsync(options) {
        const configProvider = {
            provide: 'luvien:storage:options',
            useFactory: options.useFactory,
            inject: (options.inject ?? []),
        };
        return {
            module: StorageModule_1,
            global: true,
            imports: (options.imports ?? []),
            providers: [configProvider, ...buildProvidersFromConfig()],
            exports: [STORAGE, SCOPE_CONTEXT, SCOPE_STRATEGY, StorageService],
        };
    }
};
StorageModule = StorageModule_1 = __decorate([
    Module({})
], StorageModule);
export { StorageModule };
function buildProviders(options) {
    return [
        { provide: 'luvien:storage:options', useValue: options },
        ...buildProvidersFromConfig(),
    ];
}
function buildProvidersFromConfig() {
    return [
        {
            provide: SCOPE_CONTEXT,
            useFactory: () => new ScopeContext(),
        },
        {
            provide: SCOPE_STRATEGY,
            useFactory: (options) => new PrefixScopeStrategy(options.scope),
            inject: ['luvien:storage:options'],
        },
        {
            provide: STORAGE,
            useFactory: (options, scopeStrategy, scopeContext) => {
                switch (options.driver.driver) {
                    case 's3':
                        return new S3Storage(options.driver.s3, scopeStrategy, scopeContext);
                    case 'local':
                        return new LocalStorage(options.driver.local, scopeStrategy, scopeContext);
                }
            },
            inject: ['luvien:storage:options', SCOPE_STRATEGY, SCOPE_CONTEXT],
        },
        StorageService,
    ];
}
//# sourceMappingURL=storage.module.js.map