// Key-order-independent structural comparison, so a value round-tripped
// through JSON (e.g. via the share API) still compares equal to its
// locally-constructed counterpart.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function statesDiffer(a: unknown, b: unknown): boolean {
  return stableStringify(a) !== stableStringify(b);
}
