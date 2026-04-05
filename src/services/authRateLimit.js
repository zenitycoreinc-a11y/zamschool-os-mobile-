export const DEFAULT_AUTH_RETRY_SECONDS = 30;

function extractRetryAfterSeconds(error) {
  const directValue =
    Number(error?.retryAfterSeconds) ||
    Number(error?.retry_after) ||
    Number(error?.retryAfter) ||
    Number(error?.status === 429 ? error?.retry_after_seconds : 0);

  if (Number.isFinite(directValue) && directValue > 0) {
    return Math.ceil(directValue);
  }

  const message = String(error?.message || '');
  const secondsMatch = message.match(/(\d+)\s*seconds?/i);
  if (secondsMatch) {
    return Number(secondsMatch[1]);
  }

  return DEFAULT_AUTH_RETRY_SECONDS;
}

export function getAuthRateLimitInfo(error) {
  const message = String(error?.message || error || '');
  const status = Number(error?.status || 0);
  const normalized = message.toLowerCase();
  const isRateLimited =
    status === 429 ||
    normalized.includes('too many requests') ||
    normalized.includes('rate limit') ||
    normalized.includes('for security purposes');

  if (!isRateLimited) {
    return {
      isRateLimited: false,
      retryAfterSeconds: 0,
      message,
    };
  }

  const retryAfterSeconds = extractRetryAfterSeconds(error);
  return {
    isRateLimited: true,
    retryAfterSeconds,
    message: `Too many login attempts. Try again in ${retryAfterSeconds} seconds.`,
  };
}
