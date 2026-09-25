import { describe, it, expect } from 'vitest';
import { normalizeLogicalKey } from './key.js';
import { ScopeViolationError } from './storage-error.js';

describe('normalizeLogicalKey', () => {
  it('collapses duplicate slashes', () => {
    expect(normalizeLogicalKey('a//b///c')).toBe('a/b/c');
  });

  it('strips leading and trailing slashes', () => {
    expect(normalizeLogicalKey('/a/b/')).toBe('a/b');
  });

  it('removes dot segments', () => {
    expect(normalizeLogicalKey('a/./b')).toBe('a/b');
  });

  it('rejects parent segments', () => {
    expect(() => normalizeLogicalKey('a/../b')).toThrow(ScopeViolationError);
  });

  it('rejects empty key', () => {
    expect(() => normalizeLogicalKey('')).toThrow(ScopeViolationError);
  });

  it('rejects keys that resolve to empty', () => {
    expect(() => normalizeLogicalKey('///')).toThrow(ScopeViolationError);
  });

  it('rejects segments with unusual characters', () => {
    expect(() => normalizeLogicalKey('a/$%^/b')).toThrow(ScopeViolationError);
  });

  it('accepts safe characters', () => {
    expect(normalizeLogicalKey('invoices/2026/INV-0001.pdf')).toBe(
      'invoices/2026/INV-0001.pdf',
    );
    expect(normalizeLogicalKey('a_b-c.d/e')).toBe('a_b-c.d/e');
  });
});
