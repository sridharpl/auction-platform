import { RateLimiterMemory } from 'rate-limiter-flexible';

const bidLimiter = new RateLimiterMemory({
  points: 1, // 1 bid
  duration: 1, // per second
});

const loginLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60, // per minute
});

export async function rateLimit(key: string, type: 'bid' | 'login'): Promise<boolean> {
  try {
    await (type === 'bid' ? bidLimiter : loginLimiter).consume(key);
    return true;
  } catch {
    return false;
  }
} 