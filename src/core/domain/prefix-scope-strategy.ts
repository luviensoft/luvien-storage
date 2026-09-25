import { normalizeLogicalKey } from './key.js';
import type { DataScope, StorageScopeConfig } from './scope.js';
import { ScopeViolationError } from './storage-error.js';
import type { ScopeStrategy } from '../port/scope-strategy.port.js';

export class PrefixScopeStrategy implements ScopeStrategy {
  private readonly levels;

  constructor(private readonly config: StorageScopeConfig | undefined) {
    this.levels = config?.levels ?? [];
  }

  validate(scope: DataScope | null): void {
    if (this.levels.length === 0) return;

    if (!scope) {
      throw new ScopeViolationError('Scope is required for this operation');
    }

    for (const level of this.levels) {
      const value = scope[level.field];
      if (typeof value !== 'string' || value.length === 0) {
        throw new ScopeViolationError(
          `Missing required scope field: ${level.field}`,
        );
      }
    }
  }

  resolve(logicalKey: string, scope: DataScope | null): string {
    const normalized = normalizeLogicalKey(logicalKey);

    if (this.levels.length === 0) {
      return normalized;
    }

    this.validate(scope);

    const parts: string[] = [];
    for (const level of this.levels) {
      parts.push(level.name);
      parts.push(scope![level.field]);
    }
    parts.push(normalized);

    return parts.join('/');
  }
}
