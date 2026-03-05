import { TwitterApi, TwitterV2IncludesHelper, TweetV2 } from 'twitter-api-v2';
import redis from '../db/redisClient';

const CACHE_TTL = 1800; // 30 minutes (Twitter data changes more frequently)

let twitterClient: TwitterApi | null = null;

/**
 * Get or create Twitter API client
 */
function getTwitterClient(): TwitterApi {
  if (!twitterClient) {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN is not configured');
    }

    twitterClient = new TwitterApi(bearerToken);
  }

  return twitterClient;
}

export interface TwitterSearchResult {
  tweets: TweetV2[];
  users: any[];
  meta: {
    newest_id?: string;
    oldest_id?: string;
    result_count: number;
    next_token?: string;
  };
}

/**
 * Search recent tweets (last 7 days)
 */
export async function searchTweets(
  query: string,
  maxResults: number = 10
): Promise<TwitterSearchResult> {
  const cacheKey = `twitter:search:${query}:${maxResults}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Twitter] Cache hit for query: ${query}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[Twitter] Cache read failed:', err);
  }

  try {
    const client = getTwitterClient();

    console.log(`[Twitter] Searching tweets for: ${query}`);

    const response = await client.v2.search(query, {
      max_results: Math.min(maxResults, 100), // Twitter API max is 100
      'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'lang', 'possibly_sensitive'],
      'user.fields': ['name', 'username', 'verified', 'description', 'profile_image_url'],
      expansions: ['author_id']
    });

    const result: TwitterSearchResult = {
      tweets: response.data.data || [],
      users: response.includes?.users || [],
      meta: response.data.meta
    };

    // Cache result
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`[Twitter] Cached search results for: ${query}`);
    } catch (err) {
      console.warn('[Twitter] Cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[Twitter] Search failed:', error);

    // Handle rate limit
    if (error.code === 429 || error.rateLimit) {
      throw new Error('Twitter API rate limit exceeded. Please try again later.');
    }

    // Fallback to mock data
    console.warn('[Twitter] Returning mock data due to error');
    return getMockTwitterData(query);
  }
}

/**
 * Get tweets by user
 */
export async function getUserTweets(
  username: string,
  maxResults: number = 10
): Promise<TwitterSearchResult> {
  const cacheKey = `twitter:user:${username}:${maxResults}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Twitter] Cache read failed:', err);
  }

  try {
    const client = getTwitterClient();

    // First get user ID from username
    const user = await client.v2.userByUsername(username, {
      'user.fields': ['name', 'username', 'verified', 'description', 'profile_image_url', 'public_metrics']
    });

    if (!user.data) {
      throw new Error(`User not found: ${username}`);
    }

    // Then get user's tweets
    const tweets = await client.v2.userTimeline(user.data.id, {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': ['created_at', 'public_metrics', 'lang'],
      exclude: ['retweets', 'replies']
    });

    const result: TwitterSearchResult = {
      tweets: tweets.data.data || [],
      users: [user.data],
      meta: tweets.data.meta
    };

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      console.warn('[Twitter] Cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[Twitter] User timeline failed:', error);
    throw error;
  }
}

/**
 * Get user profile by username
 */
export async function getTwitterUser(username: string): Promise<any> {
  const cacheKey = `twitter:profile:${username}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Twitter] Cache read failed:', err);
  }

  try {
    const client = getTwitterClient();

    const user = await client.v2.userByUsername(username, {
      'user.fields': [
        'name',
        'username',
        'verified',
        'description',
        'profile_image_url',
        'public_metrics',
        'created_at',
        'location',
        'url'
      ]
    });

    if (!user.data) {
      throw new Error(`User not found: ${username}`);
    }

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(user.data));
    } catch (err) {
      console.warn('[Twitter] Cache write failed:', err);
    }

    return user.data;
  } catch (error: any) {
    console.error('[Twitter] User lookup failed:', error);
    throw error;
  }
}

/**
 * Mock data fallback
 */
function getMockTwitterData(query: string): TwitterSearchResult {
  return {
    tweets: [
      {
        id: 'mock-1',
        text: `Mock tweet about ${query} (Twitter API unavailable)`,
        author_id: 'mock-author',
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 10,
          reply_count: 5,
          like_count: 25,
          quote_count: 2,
          bookmark_count: 3,
          impression_count: 500
        },
        lang: 'en',
        edit_history_tweet_ids: ['mock-1']
      }
    ],
    users: [
      {
        id: 'mock-author',
        name: 'Mock User',
        username: 'mockuser',
        verified: false,
        description: 'Mock Twitter user for testing'
      }
    ],
    meta: {
      result_count: 1
    }
  };
}

/**
 * Health check for Twitter API
 */
export async function checkTwitterHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = getTwitterClient();
    // Simple test query to verify connection
    await client.v2.search('test', { max_results: 10 });
    return { connected: true };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}
