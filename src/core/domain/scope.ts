/**
 * A generic map of scope dimensions. The library does not interpret the keys.
 * Example: { tenantId: 'tenant-1', outletId: 'outlet-10' }
 */
export type DataScope = Record<string, string>;

export interface StorageScopeLevel {
  /** Scope key name, e.g. 'tenant' or 'outlet'. */
  name: string;
  /** DataScope property to read, e.g. 'tenantId' or 'outletId'. */
  field: string;
}

export interface StorageScopeConfig {
  /**
   * Ordered list of scope levels. The physical key prefix is built by
   * iterating this list in order: `name/value/name/value/...`.
   */
  levels: StorageScopeLevel[];
}
