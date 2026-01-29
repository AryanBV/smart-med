/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitRecord {
  count: number;
  timestamp: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.timestamp > windowMs) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., user ID, IP address)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetIn: number } {
  cleanup(windowMs);

  const now = Date.now();
  const record = rateLimitMap.get(key);

  // First request or window expired
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowMs,
    };
  }

  // Rate limit exceeded
  if (record.count >= limit) {
    const resetIn = windowMs - (now - record.timestamp);
    return {
      success: false,
      remaining: 0,
      resetIn,
    };
  }

  // Increment count
  record.count++;
  return {
    success: true,
    remaining: limit - record.count,
    resetIn: windowMs - (now - record.timestamp),
  };
}

/**
 * Reset rate limit for a key (useful for testing)
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
