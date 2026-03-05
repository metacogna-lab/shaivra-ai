import { searchTweets, getUserTweets, getTwitterUser, type TwitterSearchResult } from '../integrations/twitter';
import { searchReddit, searchSubreddit, getRedditUser, type RedditSearchResult } from '../integrations/reddit';

export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'reddit';
  author: string;
  content: string;
  url: string;
  engagement: {
    likes?: number;
    retweets?: number;
    replies?: number;
    score?: number;
    comments?: number;
  };
  created_at: string | number;
  metadata: Record<string, any>;
}

export interface SocialMediaAggregateResult {
  query: string;
  platforms: ('twitter' | 'reddit')[];
  posts: SocialMediaPost[];
  summary: {
    total_posts: number;
    by_platform: {
      twitter?: number;
      reddit?: number;
    };
    sentiment_estimate?: 'positive' | 'negative' | 'neutral' | 'mixed';
    top_keywords?: string[];
  };
  generated_at: string;
}

/**
 * Aggregate social media data from Twitter and Reddit
 */
export async function aggregateSocialMedia(
  query: string,
  platforms: ('twitter' | 'reddit')[] = ['twitter', 'reddit'],
  limit: number = 25
): Promise<SocialMediaAggregateResult> {
  const posts: SocialMediaPost[] = [];
  const byPlatform: Record<string, number> = {};

  // Run queries in parallel
  const results = await Promise.allSettled(
    platforms.map(platform => {
      if (platform === 'twitter') {
        return searchTweets(query, limit);
      } else if (platform === 'reddit') {
        return searchReddit(query, limit);
      }
      return Promise.resolve(null);
    })
  );

  // Process Twitter results
  if (platforms.includes('twitter') && results[platforms.indexOf('twitter')].status === 'fulfilled') {
    const twitterData = (results[platforms.indexOf('twitter')] as PromiseFulfilledResult<TwitterSearchResult>).value;

    if (twitterData && twitterData.tweets) {
      for (const tweet of twitterData.tweets) {
        const user = twitterData.users?.find(u => u.id === tweet.author_id);

        posts.push({
          id: tweet.id,
          platform: 'twitter',
          author: user?.username || tweet.author_id,
          content: tweet.text,
          url: `https://twitter.com/${user?.username}/status/${tweet.id}`,
          engagement: {
            likes: tweet.public_metrics?.like_count,
            retweets: tweet.public_metrics?.retweet_count,
            replies: tweet.public_metrics?.reply_count
          },
          created_at: tweet.created_at || new Date().toISOString(),
          metadata: {
            lang: tweet.lang,
            possibly_sensitive: tweet.possibly_sensitive,
            author_verified: user?.verified,
            author_name: user?.name
          }
        });
      }

      byPlatform.twitter = twitterData.tweets.length;
    }
  }

  // Process Reddit results
  if (platforms.includes('reddit') && results[platforms.indexOf('reddit')].status === 'fulfilled') {
    const redditData = (results[platforms.indexOf('reddit')] as PromiseFulfilledResult<RedditSearchResult>).value;

    if (redditData && redditData.posts) {
      for (const post of redditData.posts) {
        posts.push({
          id: post.id,
          platform: 'reddit',
          author: post.author,
          content: `${post.title}\n\n${post.selftext}`,
          url: post.permalink,
          engagement: {
            score: post.score,
            comments: post.num_comments
          },
          created_at: post.created_utc,
          metadata: {
            subreddit: post.subreddit,
            upvote_ratio: post.upvote_ratio,
            is_self: post.is_self,
            over_18: post.over_18
          }
        });
      }

      byPlatform.reddit = redditData.posts.length;
    }
  }

  // Sort by engagement (simple heuristic)
  posts.sort((a, b) => {
    const aEngagement = (a.engagement.likes || 0) + (a.engagement.retweets || 0) + (a.engagement.score || 0);
    const bEngagement = (b.engagement.likes || 0) + (b.engagement.retweets || 0) + (b.engagement.score || 0);
    return bEngagement - aEngagement;
  });

  // Estimate sentiment (very basic keyword-based)
  const sentiment = estimateSentiment(posts.map(p => p.content).join(' '));

  // Extract top keywords (basic)
  const topKeywords = extractTopKeywords(posts.map(p => p.content).join(' '), 5);

  return {
    query,
    platforms,
    posts,
    summary: {
      total_posts: posts.length,
      by_platform: byPlatform,
      sentiment_estimate: sentiment,
      top_keywords: topKeywords
    },
    generated_at: new Date().toISOString()
  };
}

/**
 * Monitor a specific user across platforms
 */
export async function monitorUser(
  username: string,
  platforms: ('twitter' | 'reddit')[] = ['twitter', 'reddit']
): Promise<any> {
  const results: any = {
    username,
    platforms: {},
    generated_at: new Date().toISOString()
  };

  // Twitter
  if (platforms.includes('twitter')) {
    try {
      const profile = await getTwitterUser(username);
      const tweets = await getUserTweets(username, 10);

      results.platforms.twitter = {
        success: true,
        profile,
        recent_posts: tweets.tweets.map(t => ({
          id: t.id,
          text: t.text,
          created_at: t.created_at,
          metrics: t.public_metrics
        }))
      };
    } catch (error: any) {
      results.platforms.twitter = {
        success: false,
        error: error.message
      };
    }
  }

  // Reddit
  if (platforms.includes('reddit')) {
    try {
      const profile = await getRedditUser(username);

      results.platforms.reddit = {
        success: true,
        profile
      };
    } catch (error: any) {
      results.platforms.reddit = {
        success: false,
        error: error.message
      };
    }
  }

  return results;
}

/**
 * Basic sentiment estimation (keyword-based)
 */
function estimateSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const lowerText = text.toLowerCase();

  const positiveWords = ['good', 'great', 'excellent', 'love', 'best', 'amazing', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'horrible', 'poor', 'disappointing'];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    positiveCount += (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
  }

  for (const word of negativeWords) {
    negativeCount += (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 'neutral';

  const positiveRatio = positiveCount / total;

  if (positiveRatio > 0.7) return 'positive';
  if (positiveRatio < 0.3) return 'negative';
  return 'mixed';
}

/**
 * Extract top keywords (basic frequency analysis)
 */
function extractTopKeywords(text: string, limit: number = 5): string[] {
  const lowerText = text.toLowerCase();

  // Remove common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);

  // Extract words
  const words = lowerText.match(/\b[a-z]{3,}\b/g) || [];

  // Count frequencies
  const frequencies = new Map<string, number>();

  for (const word of words) {
    if (!stopWords.has(word)) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
  }

  // Sort by frequency
  const sorted = Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);

  return sorted;
}
