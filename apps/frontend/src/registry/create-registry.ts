/**
 * =============================================================================
 * Generic registry primitive
 * =============================================================================
 *
 * A registry maps string keys to values. It's typed, pluggable, and supports a
 * fallback for unknown keys so callers never crash.
 *
 * This is the single pattern used for:
 *   - field-type renderers    (type: "text" | "number" | "select" | ...)
 *   - page-type renderers     (type: "form" | "table" | "dashboard")
 *   - dashboard widget kinds  (type: "metric" | "chart" | "list" | ...)
 *
 * No switch statements. Add a component → call `register` → done.
 */

export interface Registry<TValue> {
  /** Get a value or `undefined`. */
  get(key: string): TValue | undefined;
  /** Get a value or the configured fallback. Always returns something. */
  resolve(key: string): TValue;
  /** Register (or override) an entry. */
  register(key: string, value: TValue): void;
  /** Register many entries at once. */
  registerAll(entries: Record<string, TValue>): void;
  /** Remove an entry. */
  unregister(key: string): boolean;
  /** `true` if a key is registered. */
  has(key: string): boolean;
  /** List of registered keys. */
  keys(): string[];
  /** Total entries (excluding fallback). */
  size: number;
}

export interface CreateRegistryOptions<TValue> {
  /** Name shown in dev warnings. */
  name: string;
  /** Value returned by `resolve()` when a key is missing. */
  fallback: TValue;
  /** Initial entries. */
  entries?: Record<string, TValue>;
  /** Hook fired when `resolve()` falls back. Use for dev warnings / telemetry. */
  onMiss?: (key: string) => void;
}

export function createRegistry<TValue>(opts: CreateRegistryOptions<TValue>): Registry<TValue> {
  const map = new Map<string, TValue>();

  if (opts.entries) {
    for (const [k, v] of Object.entries(opts.entries)) map.set(k, v);
  }

  const registry: Registry<TValue> = {
    get(key) {
      return map.get(key);
    },
    resolve(key) {
      const hit = map.get(key);
      if (hit !== undefined) return hit;
      opts.onMiss?.(key);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[registry:${opts.name}] no entry for "${key}" — using fallback`);
      }
      return opts.fallback;
    },
    register(key, value) {
      map.set(key, value);
    },
    registerAll(entries) {
      for (const [k, v] of Object.entries(entries)) map.set(k, v);
    },
    unregister(key) {
      return map.delete(key);
    },
    has(key) {
      return map.has(key);
    },
    keys() {
      return Array.from(map.keys());
    },
    get size() {
      return map.size;
    },
  };

  return registry;
}
