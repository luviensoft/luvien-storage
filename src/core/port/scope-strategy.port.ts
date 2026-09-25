import type { DataScope } from '../domain/scope.js';

export const SCOPE_STRATEGY = 'luvien:storage:scope-strategy';

export interface ScopeStrategy {
  /**
   * Validate the given scope. Throws ScopeViolationError on failure.
   * Fail-closed.
   */
  validate(scope: DataScope | null): void;

  /**
   * Return the physical key for the given logical key in the given scope.
   * The returned key is what the adapter sends to the provider.
   */
  resolve(logicalKey: string, scope: DataScope | null): string;
}
