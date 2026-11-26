export function randomInt(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick(items, rng) {
  return items[randomInt(0, items.length - 1, rng)];
}

let sequence = 0;
export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${sequence++}`;
}
