const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

export async function resolveApiOrigin(resolveOrigins = resolveApiOrigins) {
  const origins = await resolveOrigins();
  return origins[0];
}

export async function resolveApiOrigins() {
  const { default: Constants } = await import('expo-constants');
  return resolveApiOriginsFromConfig({
    nodeEnv: process.env.NODE_ENV,
    env: process.env,
    routerConfig: Constants.expoConfig?.extra?.router || {},
  });
}

export function resolveApiOriginsForRuntime({
  nodeEnv = process.env.NODE_ENV,
  localOrigin = '',
  previewOrigin = '',
} = {}) {
  const useLocalDevelopmentOrigin = isLocalDevelopmentRuntime(nodeEnv);
  const selectedOrigins = useLocalDevelopmentOrigin
    ? [localOrigin, previewOrigin]
    : [previewOrigin];

  const cleanOrigins = normalizeApiOrigins(selectedOrigins);
  if (cleanOrigins.length === 0) {
    throw new Error(
      useLocalDevelopmentOrigin
        ? 'API origin is not configured. Set EXPO_PUBLIC_WEBAPP_ORIGIN for local development.'
        : 'API origin is not configured. Set EXPO_PUBLIC_WEBAPP_PREVIEW_ORIGIN for preview builds.'
    );
  }

  if (!useLocalDevelopmentOrigin && isLoopbackOrigin(cleanOrigins[0])) {
    throw new Error(
      'Preview API origin cannot be loopback. Set EXPO_PUBLIC_WEBAPP_PREVIEW_ORIGIN to a hosted origin.'
    );
  }

  return cleanOrigins;
}

export function resolveApiOriginsFromConfig({
  nodeEnv = process.env.NODE_ENV,
  env = process.env,
  routerConfig = {},
} = {}) {
  const localOrigin =
    env.EXPO_PUBLIC_WEBAPP_ORIGIN ||
    env.EXPO_PUBLIC_API_ORIGIN ||
    env.EXPO_PUBLIC_WEBAPP_LOCAL_ORIGIN ||
    routerConfig.localOrigin ||
    '';
  const previewOrigin =
    env.EXPO_PUBLIC_WEBAPP_PREVIEW_ORIGIN ||
    env.EXPO_PUBLIC_WEBAPP_HOSTED_ORIGIN ||
    routerConfig.previewOrigin ||
    routerConfig.origin ||
    routerConfig.headOrigin ||
    '';

  return resolveApiOriginsForRuntime({
    nodeEnv,
    localOrigin,
    previewOrigin,
  });
}

export async function apiRequest(path, options = {}, dependencies = {}) {
  const requireSupabase =
    dependencies.requireSupabase || (await import('./supabase.js')).requireSupabase;
  const resolveOrigins = dependencies.resolveOrigins || resolveApiOrigins;
  const client = await requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Sign in again to continue.');
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const origins = await resolveOrigins();
  let lastNetworkError = null;

  for (const origin of origins) {
    const requestUrl = `${origin}${path}`;
    try {
      const response = await fetchWithTimeout(requestUrl, {
        ...options,
        headers,
      });

      const text = await response.text();
      const payload = text ? safeJsonParse(text) : {};

      if (!response.ok) {
        throw new Error(payload?.error || `Request failed with status ${response.status}.`);
      }

      return payload;
    } catch (error) {
      const normalizedError = normalizeRequestError(error, requestUrl, origin);
      lastNetworkError = normalizedError;

      if (!isRetryableNetworkError(normalizedError) || origin === origins[origins.length - 1]) {
        throw normalizedError;
      }
    }
  }

  throw lastNetworkError || new Error('Network request failed.');
}

async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = Number.isFinite(options?.timeoutMs)
    ? Number(options.timeoutMs)
    : DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeApiOrigins(origins) {
  const normalized = [];
  const seen = new Set();

  for (const origin of origins || []) {
    const cleanOriginValue = String(origin || '').trim().replace(/\/+$/, '');
    if (!cleanOriginValue) {
      continue;
    }

    let nextOrigin = cleanOriginValue;
    try {
      nextOrigin = cleanOrigin(new URL(cleanOriginValue));
    } catch {
      nextOrigin = cleanOriginValue;
    }

    if (seen.has(nextOrigin)) {
      continue;
    }

    seen.add(nextOrigin);
    normalized.push(nextOrigin);
  }

  return normalized;
}

function cleanOrigin(url) {
  return url.toString().replace(/\/+$/, '');
}

function isLocalDevelopmentRuntime(nodeEnv) {
  return String(nodeEnv || '').trim().toLowerCase() === 'development';
}

function isLoopbackOrigin(origin) {
  try {
    const url = new URL(origin);
    return isLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname) {
  const value = String(hostname || '').trim().toLowerCase();
  return value === '127.0.0.1' || value === 'localhost' || value === '0.0.0.0';
}

function normalizeRequestError(error, requestUrl, origin) {
  const message = String(error?.message || '').trim();

  if (String(error?.name || '').trim() === 'AbortError') {
    return new Error(
      `Request timed out while contacting ${origin}. Check that the web app is running and reachable from this device.`
    );
  }

  if (isRetryableNetworkError(error)) {
    return new Error(
      `Unable to reach ${origin}. Check your network connection and confirm the mobile API origin is reachable from the device.`
    );
  }

  if (!message) {
    return new Error(`Request failed for ${requestUrl}.`);
  }

  return error instanceof Error ? error : new Error(message);
}

function isRetryableNetworkError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    String(error?.name || '').trim() === 'AbortError'
  );
}
