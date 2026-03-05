import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL?.trim();
const redisDisabled = process.env.REDIS_DISABLED === '1' || process.env.REDIS_DISABLED === 'true';

/** Stub when Redis is disabled or URL unset: no cache, no connection. */
const stubRedis = {
  get: async (_key: string): Promise<null> => null,
  setex: async (_key: string, _ttl: number, _value: string): Promise<void> => undefined,
  on: () => stubRedis,
};

let redisErrorLogged = false;

function createClient(): Redis | typeof stubRedis {
  if (redisDisabled || !redisUrl) {
    return stubRedis;
  }
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
  });
  client.on('error', (err) => {
    if (!redisErrorLogged) {
      redisErrorLogged = true;
      console.warn('Redis unavailable:', (err as Error).message || err);
    }
  });
  return client;
}

const redis = createClient();
export default redis;
