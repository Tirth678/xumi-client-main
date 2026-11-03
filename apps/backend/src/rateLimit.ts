import type { NextFunction, Request, Response } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Small fixed-window rate limiter. State is per-process, which is the right
 * trade-off for a Vercel Function: it throttles bursts and brute-force loops
 * without adding a Redis dependency. Warm instances share the bucket map.
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyFor?: (request: Request) => string;
}) => {
  const buckets = new Map<string, Bucket>();
  let lastSweep = Date.now();

  const sweep = (now: number) => {
    // Amortized cleanup so the map cannot grow without bound.
    if (now - lastSweep < options.windowMs) return;
    lastSweep = now;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  };

  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    sweep(now);
    const key = options.keyFor?.(request) ?? request.ip ?? "unknown";
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      response.setHeader("Retry-After", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      return response.status(429).json({ error: options.message ?? "Too many requests. Please try again shortly." });
    }
    return next();
  };
};
