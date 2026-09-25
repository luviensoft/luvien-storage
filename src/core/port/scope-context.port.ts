import { AsyncLocalStorage } from 'node:async_hooks';
import type { DataScope } from '../domain/scope.js';

export const SCOPE_CONTEXT = 'luvien:storage:scope-context';

export class ScopeContext {
  private readonly storage = new AsyncLocalStorage<DataScope>();

  get(): DataScope | null {
    return this.storage.getStore() ?? null;
  }

  run<T>(scope: DataScope, fn: () => T): T {
    return this.storage.run(scope, fn);
  }

  runUnscoped<T>(fn: () => T): T {
    return this.storage.run({}, fn);
  }
}
