import Snoowrap, { Submission, Subreddit, Comment } from 'snoowrap';
import redis from '../db/redisClient';

const CACHE_TTL = 1800; // 30 minutes

let redditClient: Snoowrap | null = null;

/**
 * Get or create Reddit API client
 */
function getRedditClient(): Snoowrap {
  if (!redditClient) {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const refreshToken = process.env.REDDIT_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Reddit API credentials not configured (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REFRESH_TOKEN required)');
    }

    redditClient = new Snoowrap({
      userAgent: 'Shaivra Intelligence Suite v1.0.0 (OSINT platform)',
      clientId,
      clientSecret,
      refreshToken
    });

    // Configure rate limiting (Reddit: 60 requests/min)
    redditClient.config({ requestDelay: 1100 }); // 1.1 seconds between requests
  }

  return redditClient;
}

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  selftext: string;
  url: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  is_self: boolean;
  over_18: boolean;
  spoiler: boolean;
  stickied: boolean;
}

export interface RedditSearchResult {
  posts: RedditPost[];
  meta: {
    total_results: number;
    query: string;
  };
}

/**
 * Search Reddit posts across all subreddits
 */
export async function searchReddit(
  query: string,
  limit: number = 25,
  sort: 'relevance' | 'hot' | 'new' | 'comments' = 'relevance'
): Promise<RedditSearchResult> {
  const cacheKey = `reddit:search:${query}:${sort}:${limit}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Reddit] Cache hit for query: ${query}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[Reddit] Cache read failed:', err);
  }

  try {
    const client = getRedditClient();

    console.log(`[Reddit] Searching for: ${query} (sort: ${sort}, limit: ${limit})`);

    const results = await client.search({
      query,
      sort,
      time: 'all',
      limit: Math.min(limit, 100) // Reddit API max is 100
    });

    const posts: RedditPost[] = results.map((submission: Submission) => ({
      id: submission.id,
      title: submission.title,
      author: submission.author.name,
      subreddit: submission.subreddit.display_name,
      selftext: submission.selftext || '',
      url: submission.url,
      score: submission.score,
      upvote_ratio: submission.upvote_ratio,
      num_comments: submission.num_comments,
      created_utc: submission.created_utc,
      permalink: `https://reddit.com${submission.permalink}`,
      is_self: submission.is_self,
      over_18: submission.over_18,
      spoiler: submission.spoiler,
      stickied: submission.stickied
    }));

    const result: RedditSearchResult = {
      posts,
      meta: {
        total_results: posts.length,
        query
      }
    };

    // Cache result
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`[Reddit] Cached search results for: ${query}`);
    } catch (err) {
      console.warn('[Reddit] Cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[Reddit] Search failed:', error);

    // Check for rate limit
    if (error.statusCode === 429) {
      throw new Error('Reddit API rate limit exceeded (60 requests/min)');
    }

    // Fallback to mock data
    console.warn('[Reddit] Returning mock data due to error');
    return getMockRedditData(query);
  }
}

/**
 * Search posts in a specific subreddit
 */
export async function searchSubreddit(
  subredditName: string,
  query?: string,
  limit: number = 25,
  sort: 'hot' | 'new' | 'top' | 'rising' = 'hot'
): Promise<RedditSearchResult> {
  const cacheKey = query
    ? `reddit:sub:${subredditName}:${query}:${sort}:${limit}`
    : `reddit:sub:${subredditName}:${sort}:${limit}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Reddit] Cache read failed:', err);
  }

  try {
    const client = getRedditClient();
    const subreddit = client.getSubreddit(subredditName);

    let submissions: Submission[];

    if (query) {
      submissions = await subreddit.search({
        query,
        sort: 'relevance',
        limit: Math.min(limit, 100)
      });
    } else {
      switch (sort) {
        case 'hot':
          submissions = await subreddit.getHot({ limit: Math.min(limit, 100) });
          break;
        case 'new':
          submissions = await subreddit.getNew({ limit: Math.min(limit, 100) });
          break;
        case 'top':
          submissions = await subreddit.getTop({ time: 'week', limit: Math.min(limit, 100) });
          break;
        case 'rising':
          submissions = await subreddit.getRising({ limit: Math.min(limit, 100) });
          break;
        default:
          submissions = await subreddit.getHot({ limit: Math.min(limit, 100) });
      }
    }

    const posts: RedditPost[] = submissions.map((submission: Submission) => ({
      id: submission.id,
      title: submission.title,
      author: submission.author.name,
      subreddit: submission.subreddit.display_name,
      selftext: submission.selftext || '',
      url: submission.url,
      score: submission.score,
      upvote_ratio: submission.upvote_ratio,
      num_comments: submission.num_comments,
      created_utc: submission.created_utc,
      permalink: `https://reddit.com${submission.permalink}`,
      is_self: submission.is_self,
      over_18: submission.over_18,
      spoiler: submission.spoiler,
      stickied: submission.stickied
    }));

    const result: RedditSearchResult = {
      posts,
      meta: {
        total_results: posts.length,
        query: query || `r/${subredditName} (${sort})`
      }
    };

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      console.warn('[Reddit] Cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[Reddit] Subreddit search failed:', error);
    throw error;
  }
}

/**
 * Get subreddit information
 */
export async function getSubredditInfo(subredditName: string): Promise<any> {
  const cacheKey = `reddit:info:${subredditName}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Reddit] Cache read failed:', err);
  }

  try {
    const client = getRedditClient();
    const subreddit = await client.getSubreddit(subredditName).fetch();

    const info = {
      name: subreddit.display_name,
      title: subreddit.title,
      public_description: subreddit.public_description,
      subscribers: subreddit.subscribers,
      active_users: subreddit.active_user_count,
      created_utc: subreddit.created_utc,
      over_18: subreddit.over18,
      url: `https://reddit.com/r/${subreddit.display_name}`,
      icon_img: subreddit.icon_img,
      banner_img: subreddit.banner_img
    };

    try {
      await redis.setex(cacheKey, CACHE_TTL * 2, JSON.stringify(info)); // Cache subreddit info longer (1 hour)
    } catch (err) {
      console.warn('[Reddit] Cache write failed:', err);
    }

    return info;
  } catch (error: any) {
    console.error('[Reddit] Subreddit info failed:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getRedditUser(username: string): Promise<any> {
  const cacheKey = `reddit:user:${username}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Reddit] Cache read failed:', err);
  }

  try {
    const client = getRedditClient();
    const user = await client.getUser(username).fetch();

    const profile = {
      name: user.name,
      id: user.id,
      created_utc: user.created_utc,
      link_karma: user.link_karma,
      comment_karma: user.comment_karma,
      is_gold: user.is_gold,
      is_mod: user.is_mod,
      has_verified_email: user.has_verified_email,
      icon_img: user.icon_img
    };

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(profile));
    } catch (err) {
      console.warn('[Reddit] Cache write failed:', err);
    }

    return profile;
  } catch (error: any) {
    console.error('[Reddit] User lookup failed:', error);
    throw error;
  }
}

/**
 * Mock data fallback
 */
function getMockRedditData(query: string): RedditSearchResult {
  return {
    posts: [
      {
        id: 'mock-1',
        title: `Mock Reddit post about ${query}`,
        author: 'mock_user',
        subreddit: 'mock',
        selftext: 'This is mock Reddit data (API unavailable)',
        url: 'https://reddit.com/r/mock',
        score: 42,
        upvote_ratio: 0.85,
        num_comments: 10,
        created_utc: Math.floor(Date.now() / 1000),
        permalink: 'https://reddit.com/r/mock/comments/mock',
        is_self: true,
        over_18: false,
        spoiler: false,
        stickied: false
      }
    ],
    meta: {
      total_results: 1,
      query
    }
  };
}

/**
 * Health check for Reddit API
 */
export async function checkRedditHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = getRedditClient();
    // Simple test query
    await client.getSubreddit('test').fetch();
    return { connected: true };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}
