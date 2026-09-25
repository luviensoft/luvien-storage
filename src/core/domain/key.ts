import { ScopeViolationError } from './storage-error.js';

const SEGMENT_RE = /^[A-Za-z0-9._-]+$/;

/**
 * Normalize a logical key. Rejects anything ambiguous.
 *
 * Rules:
 *   - leading slash is stripped
 *   - trailing slash is stripped
 *   - duplicate slashes are collapsed
 *   - "." segments are removed
 *   - ".." segments are rejected (throws)
 *   - empty result is rejected (throws)
 *   - each remaining segment must match a conservative charset
 *   - total length must not exceed 1024 characters
 */
export function normalizeLogicalKey(key: string): string {
  if (key.length === 0) {
    throw new ScopeViolationError('Empty storage key');
  }
  if (key.length > 1024) {
    throw new ScopeViolationError('Storage key too long');
  }

  const segments = key.split('/').filter((s) => s.length > 0);

  const normalized: string[] = [];
  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      throw new ScopeViolationError('Storage key contains ".." segment');
    }
    if (!SEGMENT_RE.test(segment)) {
      throw new ScopeViolationError(
        `Invalid storage key segment: "${segment}"`,
      );
    }
    normalized.push(segment);
  }

  if (normalized.length === 0) {
    throw new ScopeViolationError('Storage key resolves to empty');
  }

  return normalized.join('/');
}
