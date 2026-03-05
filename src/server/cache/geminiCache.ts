import redis from '../db/redisClient';
import crypto from 'crypto';

const CACHE_TTL = 3600; // 1 hour

export async function cachedGeminiCall<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const cacheKey = `gemini:${crypto.createHash('md5').update(key).digest('hex')}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('Cache read failed:', err);
  }

  const result = await fn();

  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.warn('Cache write failed:', err);
  }

  return result;
}
