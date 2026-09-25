import { describe, it, expect } from 'vitest';
import { PrefixScopeStrategy } from './prefix-scope-strategy.js';
import { ScopeViolationError } from './storage-error.js';

describe('PrefixScopeStrategy', () => {
  const config = {
    levels: [
      { name: 'tenant', field: 'tenantId' },
      { name: 'outlet', field: 'outletId' },
    ],
  };

  it('produces deterministic ordered prefix', () => {
    const s = new PrefixScopeStrategy(config);
    const key = s.resolve('invoices/x.pdf', {
      tenantId: 't1',
      outletId: 'o1',
    });
    expect(key).toBe('tenant/t1/outlet/o1/invoices/x.pdf');
  });

  it('validate throws on null scope', () => {
    const s = new PrefixScopeStrategy(config);
    expect(() => s.validate(null)).toThrow(ScopeViolationError);
  });

  it('validate throws on missing field', () => {
    const s = new PrefixScopeStrategy(config);
    expect(() => s.validate({ tenantId: 't1' })).toThrow(ScopeViolationError);
  });

  it('no levels means identity resolution', () => {
    const s = new PrefixScopeStrategy(undefined);
    expect(s.resolve('a/b.txt', null)).toBe('a/b.txt');
    expect(() => s.validate(null)).not.toThrow();
  });

  it('normalizes logical key before prefixing', () => {
    const s = new PrefixScopeStrategy(config);
    const key = s.resolve('/a//b/', { tenantId: 't', outletId: 'o' });
    expect(key).toBe('tenant/t/outlet/o/a/b');
  });
});
