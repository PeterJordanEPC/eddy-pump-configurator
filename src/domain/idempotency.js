function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export class IdempotencyTracker {
  constructor(keyFactory = newIdempotencyKey) {
    this.keyFactory = keyFactory;
    this.key = null;
    this.signature = null;
  }

  keyFor(payload) {
    const signature = JSON.stringify(stable(payload));
    if (this.signature !== signature) {
      this.signature = signature;
      this.key = this.keyFactory();
    }
    return this.key;
  }

  reset() {
    this.key = null;
    this.signature = null;
  }
}

export function newIdempotencyKey() {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `web:${random}`;
}
