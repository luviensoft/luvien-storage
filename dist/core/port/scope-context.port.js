import { AsyncLocalStorage } from 'node:async_hooks';
export const SCOPE_CONTEXT = 'luvien:storage:scope-context';
export class ScopeContext {
    storage = new AsyncLocalStorage();
    get() {
        return this.storage.getStore() ?? null;
    }
    run(scope, fn) {
        return this.storage.run(scope, fn);
    }
    runUnscoped(fn) {
        return this.storage.run({}, fn);
    }
}
//# sourceMappingURL=scope-context.port.js.map