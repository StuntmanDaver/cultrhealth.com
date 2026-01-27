/**
 * Rate Limiting Module
 * 
 * Provides IP-based rate limiting for API endpoints.
 * Supports both in-memory (development) and Redis (production) backends.
 * 
 * Usage:
 *   const limiter = rateLimit({ limit: 5, windowMs: 60000 });
 *   const result = await limiter.check(ip);
 *   if (!result.success) return error response;
 */

// ===========================================
// TYPES
// ===========================================

interface RateLimitConfig {
  /** Maximum requests allowed per window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
  /** Identifier prefix for Redis keys */
  prefix?: string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number  // Unix timestamp when limit resets
}

interface RateLimiter {
  check: (identifier: string) => Promise<RateLimitResult>
  reset: (identifier: string) => Promise<void>
}

// ===========================================
// IN-MEMORY STORE (Development/Fallback)
// ===========================================

interface MemoryStoreEntry {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, MemoryStoreEntry>()

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Array.from(memoryStore.entries()).forEach(([key, entry]) => {
      if (entry.resetTime < now) {
        memoryStore.delete(key)
      }
    })
  }, 60000) // Clean up every minute
}

function createMemoryRateLimiter(config: RateLimitConfig): RateLimiter {
  const { limit, windowMs, prefix = 'rl' } = config

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const key = `${prefix}:${identifier}`
      const now = Date.now()
      const entry = memoryStore.get(key)

      if (!entry || entry.resetTime < now) {
        // Create new entry
        const resetTime = now + windowMs
        memoryStore.set(key, { count: 1, resetTime })
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: Math.floor(resetTime / 1000),
        }
      }

      // Increment existing entry
      entry.count++
      const success = entry.count <= limit

      return {
        success,
        limit,
        remaining: Math.max(0, limit - entry.count),
        reset: Math.floor(entry.resetTime / 1000),
      }
    },

    async reset(identifier: string): Promise<void> {
      const key = `${prefix}:${identifier}`
      memoryStore.delete(key)
    },
  }
}

// ===========================================
// UPSTASH REDIS STORE (Production)
// ===========================================

async function createRedisRateLimiter(config: RateLimitConfig): Promise<RateLimiter | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    return null
  }

  const { limit, windowMs, prefix = 'rl' } = config
  const windowSec = Math.ceil(windowMs / 1000)

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const key = `${prefix}:${identifier}`
      const now = Date.now()

      try {
        // Use Upstash REST API for atomic increment with expiry
        const response = await fetch(`${redisUrl}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['INCR', key],
            ['EXPIRE', key, windowSec],
            ['TTL', key],
          ]),
        })

        if (!response.ok) {
          throw new Error(`Redis error: ${response.status}`)
        }

        const results = await response.json()
        const count = results[0]?.result || 1
        const ttl = results[2]?.result || windowSec

        const resetTime = now + (ttl * 1000)
        const success = count <= limit

        return {
          success,
          limit,
          remaining: Math.max(0, limit - count),
          reset: Math.floor(resetTime / 1000),
        }
      } catch (error) {
        console.error('Redis rate limit error:', error)
        // Fallback to allowing the request on Redis error
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: Math.floor((now + windowMs) / 1000),
        }
      }
    },

    async reset(identifier: string): Promise<void> {
      const key = `${prefix}:${identifier}`

      try {
        await fetch(`${redisUrl}/del/${key}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redisToken}`,
          },
        })
      } catch (error) {
        console.error('Redis reset error:', error)
      }
    },
  }
}

// ===========================================
// FACTORY FUNCTION
// ===========================================

let cachedRedisLimiter: RateLimiter | null = null
let redisChecked = false

export function rateLimit(config: RateLimitConfig): RateLimiter {
  const memoryLimiter = createMemoryRateLimiter(config)

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      // Try to use Redis if available
      if (!redisChecked) {
        redisChecked = true
        cachedRedisLimiter = await createRedisRateLimiter(config)
      }

      if (cachedRedisLimiter) {
        return cachedRedisLimiter.check(identifier)
      }

      // Fallback to memory store
      return memoryLimiter.check(identifier)
    },

    async reset(identifier: string): Promise<void> {
      if (cachedRedisLimiter) {
        return cachedRedisLimiter.reset(identifier)
      }
      return memoryLimiter.reset(identifier)
    },
  }
}

// ===========================================
// PRECONFIGURED LIMITERS
// ===========================================

/**
 * Standard API rate limiter
 * 10 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
  prefix: 'api',
})

/**
 * Form submission rate limiter
 * 5 submissions per hour per IP
 */
export const formLimiter = rateLimit({
  limit: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  prefix: 'form',
})

/**
 * Strict rate limiter for sensitive endpoints
 * 3 attempts per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
  limit: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
  prefix: 'strict',
})

// ===========================================
// HELPER: Get Client IP
// ===========================================

import { headers } from 'next/headers'

export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  
  // Check various headers for the real IP
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headersList.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Vercel-specific header
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  // Fallback
  return 'unknown'
}

// ===========================================
// HELPER: Rate Limit Response
// ===========================================

import { NextResponse } from 'next/server'

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
      },
    }
  )
}
