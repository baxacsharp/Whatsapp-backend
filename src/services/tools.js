import rateLimiter from "express-rate-limit"
import speedLimiter from "express-slow-down"

// Rate Limiters per minute
export const LigthMinuteRateLimiter = rateLimiter({ windowMs: 60000, max: 100 })
export const HeavyMinuteRateLimiter = rateLimiter({ windowMs: 60000, max: 3 })

// Rate Limiters per second
export const LightSecondRateLimiter = rateLimiter({ windowMs: 1000, max: 24 })
export const HeavySecondRateLimiter = rateLimiter({ windowMs: 1000, max: 2 })

// Speed Limiters per minute
export const FastMinuteSpeedLimiter = speedLimiter({ windowMs: 60000, delayAfter: 16, delayMs: 1000 })
export const NormalMinuteSpeedLimiter = speedLimiter({ windowMs: 60000, delayAfter: 60, delayMs: 1000 })
export const SlowMinuteSpeedLimiter = speedLimiter({ windowMs: 60000, delayAfter: 240, delayMs: 3000 })

// Speed Limiters per second
export const FastSecondSpeedLimiter = speedLimiter({ windowMs: 1000, delayAfter: 2, delayMs: 1000 })
export const NormalSecondSpeedLimiter = speedLimiter({ windowMs: 1000, delayAfter: 6, delayMs: 120 })
export const SlowSecondSpeedLimiter = speedLimiter({ windowMs: 1000, delayAfter: 18, delayMs: 360 })
