/**
 * Twitter Normalizer
 * 
 * Transforms Twitter API responses into canonical IntelligenceEvent schema.
 */

import { AbstractNormalizer } from './base';
import type { IntelligenceEvent, EntityReference, Observation } from '../../types/intelligence';

// Twitter API response types (simplified - full types from integration)
export interface TwitterUserData {
  id: string;
  username: string;
  name: string;
  description?: string;
  location?: string;
  verified: boolean;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  created_at: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface TwitterSearchResponse {
  user: TwitterUserData;
  tweets?: Array<{
    id: string;
    text: string;
    created_at: string;
    public_metrics?: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
    };
  }>;
}

export class TwitterNormalizer extends AbstractNormalizer<TwitterSearchResponse> {
  readonly toolName = 'twitter';

  normalize(
    rawOutput: TwitterSearchResponse,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent {
    const startTime = Date.now();
    const event = this.createBaseEvent(target, traceId, investigationId);
    event.metadata.raw = rawOutput;

    // Create person entity from Twitter user
    const entity = this.createPersonEntity(rawOutput.user);
    event.entities.push(entity);

    // Create observations from user profile
    const profileObs = this.createProfileObservations(entity.id, rawOutput.user, traceId);
    event.observations.push(...profileObs);

    // Create observations from tweets
    if (rawOutput.tweets && rawOutput.tweets.length > 0) {
      const tweetObs = this.createTweetObservations(entity.id, rawOutput.tweets, traceId);
      event.observations.push(...tweetObs);
    }

    event.metadata.executionTime = Date.now() - startTime;
    return event;
  }

  private createPersonEntity(user: TwitterUserData): EntityReference {
    const now = new Date();

    return {
      id: this.generateId(),
      type: 'person',
      name: user.name,
      aliases: [user.username, `@${user.username}`],
      confidence: this.calculateTwitterConfidence(user),
      attributes: {
        twitter_id: user.id,
        username: user.username,
        verified: user.verified,
        description: user.description,
        location: user.location,
        followers_count: user.public_metrics?.followers_count || user.followers_count,
        following_count: user.public_metrics?.following_count || user.following_count,
        tweet_count: user.public_metrics?.tweet_count || user.tweet_count,
        profile_image: user.profile_image_url,
        account_created: user.created_at
      },
      sourceIds: [],
      firstSeen: new Date(user.created_at),
      lastSeen: now,
      metadata: {
        verified: user.verified,
        tags: user.verified ? ['verified-account'] : [],
        notes: `Twitter user: @${user.username}`
      }
    };
  }

  private createProfileObservations(entityId: string, user: TwitterUserData, traceId: string): Observation[] {
    const observations: Observation[] = [];
    const now = new Date();

    // Account verification
    observations.push({
      id: this.generateId(),
      entityId,
      type: 'attribute',
      property: 'verified_status',
      value: user.verified,
      confidence: 1.0, // Twitter verification is authoritative
      source: {
        tool: 'twitter',
        url: `https://twitter.com/${user.username}`,
        timestamp: now,
        raw: { verified: user.verified }
      },
      context: {}
    });

    // Location observation
    if (user.location) {
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'attribute',
        property: 'location',
        value: user.location,
        confidence: 0.6, // User-provided, may be inaccurate
        source: {
          tool: 'twitter',
          timestamp: now,
          raw: { location: user.location }
        },
        context: {
          self_reported: true
        }
      });
    }

    // Social influence observation
    const followers = user.public_metrics?.followers_count || user.followers_count;
    observations.push({
      id: this.generateId(),
      entityId,
      type: 'attribute',
      property: 'social_influence',
      value: {
        platform: 'twitter',
        followers: followers,
        following: user.public_metrics?.following_count || user.following_count,
        engagement_ratio: followers / Math.max(user.public_metrics?.following_count || user.following_count, 1),
        influence_tier: this.calculateInfluenceTier(followers)
      },
      confidence: 0.95,
      source: {
        tool: 'twitter',
        timestamp: now,
        raw: user.public_metrics || { followers_count: user.followers_count }
      },
      context: {}
    });

    return observations;
  }

  private createTweetObservations(entityId: string, tweets: any[], traceId: string): Observation[] {
    const observations: Observation[] = [];
    const now = new Date();

    // Activity frequency observation
    observations.push({
      id: this.generateId(),
      entityId,
      type: 'behavior',
      property: 'posting_activity',
      value: {
        recent_tweets: tweets.length,
        sample_period: '7_days',
        average_engagement: this.calculateAverageEngagement(tweets)
      },
      confidence: 0.85,
      source: {
        tool: 'twitter',
        timestamp: now,
        raw: tweets
      },
      context: {
        sample_size: tweets.length
      }
    });

    // Content sentiment (basic heuristic - could be enhanced with NLP)
    for (const tweet of tweets.slice(0, 5)) { // Limit to 5 most recent
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'behavior',
        property: 'social_media_post',
        value: {
          platform: 'twitter',
          text: tweet.text,
          created_at: tweet.created_at,
          metrics: tweet.public_metrics
        },
        confidence: 0.9,
        source: {
          tool: 'twitter',
          url: `https://twitter.com/i/web/status/${tweet.id}`,
          timestamp: new Date(tweet.created_at),
          raw: tweet
        },
        context: {}
      });
    }

    return observations;
  }

  private calculateTwitterConfidence(user: TwitterUserData): number {
    let confidence = 0.7; // Base confidence

    if (user.verified) confidence += 0.2; // Verified badge
    if (user.followers_count > 1000) confidence += 0.05;
    if (user.tweet_count > 100) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  private calculateInfluenceTier(followers: number): string {
    if (followers > 1000000) return 'mega';
    if (followers > 100000) return 'macro';
    if (followers > 10000) return 'micro';
    if (followers > 1000) return 'nano';
    return 'regular';
  }

  private calculateAverageEngagement(tweets: any[]): number {
    if (tweets.length === 0) return 0;

    const totalEngagement = tweets.reduce((sum, tweet) => {
      const metrics = tweet.public_metrics || {};
      return sum + (metrics.retweet_count || 0) + (metrics.reply_count || 0) + (metrics.like_count || 0);
    }, 0);

    return Math.round(totalEngagement / tweets.length);
  }
}
