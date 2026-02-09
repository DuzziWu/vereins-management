import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Singleton Redis Client
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set")
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// Rate Limiter für Event-Erstellung: 10 Events pro Stunde pro User
let eventRateLimiter: Ratelimit | null = null

export function getEventRateLimiter(): Ratelimit | null {
  if (eventRateLimiter) return eventRateLimiter

  const redisClient = getRedis()
  if (!redisClient) return null

  eventRateLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
    analytics: true,
    prefix: "ratelimit:events:create",
  })

  return eventRateLimiter
}

// Generische Rate-Limit Funktion
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Rate limiting deaktiviert
    return { success: true }
  }

  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
