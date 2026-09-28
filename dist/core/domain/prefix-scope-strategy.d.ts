import type { DataScope, StorageScopeConfig } from './scope.js';
import type { ScopeStrategy } from '../port/scope-strategy.port.js';
export declare class PrefixScopeStrategy implements ScopeStrategy {
    private readonly config;
    private readonly levels;
    constructor(config: StorageScopeConfig | undefined);
    validate(scope: DataScope | null): void;
    resolve(logicalKey: string, scope: DataScope | null): string;
}
//# sourceMappingURL=prefix-scope-strategy.d.ts.map