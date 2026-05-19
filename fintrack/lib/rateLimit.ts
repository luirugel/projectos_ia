// Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
// (production). Falls back to a process-local Map in development/single-instance
// deployments where Redis is not configured.
//
// NOTE: The in-memory fallback resets on cold-starts and is not shared across
// serverless instances. Configure Upstash env vars before going to production.

type RateLimitStore = {
  checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean>
}

function buildStore(): RateLimitStore {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (process.env.NODE_ENV === 'production' && (!redisUrl || !redisToken)) {
    // TODO: configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel
    // env vars. Without Redis, counters reset on cold-starts and are NOT shared
    // across serverless instances — effective limit is 10×N across N warm instances.
    console.error(
      '[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. ' +
      'Rate limiting is per-instance only and is NOT effective in serverless deployments.'
    )
  }

  if (redisUrl && redisToken) {
    // Production: shared, persistent counters across all instances
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
    const redis = new Redis({ url: redisUrl, token: redisToken })
    return {
      async checkRateLimit(key, limit, windowMs) {
        const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`
        const count: number = await redis.incr(windowKey)
        if (count === 1) await redis.pexpire(windowKey, windowMs)
        return count <= limit
      },
    }
  }

  // Development / single-instance fallback
  const store = new Map<string, { count: number; reset: number }>()
  return {
    async checkRateLimit(key, limit, windowMs) {
      const now = Date.now()
      const entry = store.get(key) ?? { count: 0, reset: now + windowMs }
      if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs }
      entry.count++
      store.set(key, entry)
      return entry.count <= limit
    },
  }
}

const rateLimitStore = buildStore()

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return rateLimitStore.checkRateLimit(key, limit, windowMs)
}
