import { normalizeLogicalKey } from './key.js';
import { ScopeViolationError } from './storage-error.js';
export class PrefixScopeStrategy {
    config;
    levels;
    constructor(config) {
        this.config = config;
        this.levels = config?.levels ?? [];
    }
    validate(scope) {
        if (this.levels.length === 0)
            return;
        if (!scope) {
            throw new ScopeViolationError('Scope is required for this operation');
        }
        for (const level of this.levels) {
            const value = scope[level.field];
            if (typeof value !== 'string' || value.length === 0) {
                throw new ScopeViolationError(`Missing required scope field: ${level.field}`);
            }
        }
    }
    resolve(logicalKey, scope) {
        const normalized = normalizeLogicalKey(logicalKey);
        if (this.levels.length === 0) {
            return normalized;
        }
        this.validate(scope);
        const parts = [];
        for (const level of this.levels) {
            parts.push(level.name);
            parts.push(scope[level.field]);
        }
        parts.push(normalized);
        return parts.join('/');
    }
}
//# sourceMappingURL=prefix-scope-strategy.js.map