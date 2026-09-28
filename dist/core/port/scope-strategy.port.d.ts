import type { DataScope } from '../domain/scope.js';
export declare const SCOPE_STRATEGY = "luvien:storage:scope-strategy";
export interface ScopeStrategy {
    validate(scope: DataScope | null): void;
    resolve(logicalKey: string, scope: DataScope | null): string;
}
//# sourceMappingURL=scope-strategy.port.d.ts.map