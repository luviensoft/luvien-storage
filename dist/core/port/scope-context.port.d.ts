import type { DataScope } from '../domain/scope.js';
export declare const SCOPE_CONTEXT = "luvien:storage:scope-context";
export declare class ScopeContext {
    private readonly storage;
    get(): DataScope | null;
    run<T>(scope: DataScope, fn: () => T): T;
    runUnscoped<T>(fn: () => T): T;
}
//# sourceMappingURL=scope-context.port.d.ts.map