const DEFAULT_TTL_MS = 20_000;
const cache = new Map();

export async function readThroughReadMostlyCache(key, loader, options = {}) {
  const ttlMs = Number.isFinite(options?.ttlMs) ? Number(options.ttlMs) : DEFAULT_TTL_MS;
  const now = Date.now();
  const existing = cache.get(key);

  if (existing?.value !== undefined && existing.expiresAt > now) {
    return existing.value;
  }

  if (existing?.inflight) {
    return existing.inflight;
  }

  const inflight = Promise.resolve()
    .then(loader)
    .then((value) => {
      cache.set(key, {
        value,
        expiresAt: Date.now() + Math.max(0, ttlMs),
        inflight: null,
      });
      return value;
    })
    .catch((error) => {
      const current = cache.get(key);
      if (current?.inflight === inflight) {
        cache.delete(key);
      }
      throw error;
    });

  cache.set(key, {
    value: existing?.value,
    expiresAt: existing?.expiresAt || 0,
    inflight,
  });

  return inflight;
}

export function peekReadMostlyCacheValue(key) {
  const existing = cache.get(key);
  if (!existing || existing.value === undefined || existing.expiresAt <= Date.now()) {
    return undefined;
  }

  return existing.value;
}

export function invalidateReadMostlyCache(match) {
  if (!match) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (typeof match === "function" ? match(key) : String(key).startsWith(String(match))) {
      cache.delete(key);
    }
  }
}

export function clearReadMostlyCache() {
  cache.clear();
}

export function __resetReadMostlyCacheForTests() {
  cache.clear();
}
