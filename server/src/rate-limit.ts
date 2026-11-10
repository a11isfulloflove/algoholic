import type { NextFunction, Request, Response } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>()

  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key)
      }
    }
  }, options.windowMs)
  cleanup.unref()

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs })
      next()
      return
    }

    if (bucket.count >= options.max) {
      res.status(429).json({ error: 'too many requests, try again later' })
      return
    }

    bucket.count += 1
    next()
  }
}
