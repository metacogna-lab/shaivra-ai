/**
 * Reddit Normalizer
 */

import { AbstractNormalizer } from './base';
import type { IntelligenceEvent, EntityReference, Observation } from '../../contracts/intelligence';

export interface RedditUserData {
  name: string;
  id: string;
  created_utc: number;
  link_karma: number;
  comment_karma: number;
  is_verified: boolean;
  is_mod: boolean;
  subreddit?: {
    subscribers: number;
  };
}

export interface RedditSearchResponse {
  user: RedditUserData;
  posts?: Array<{
    id: string;
    title: string;
    body?: string;
    created_utc: number;
    score: number;
    subreddit: string;
    num_comments: number;
  }>;
  comments?: Array<{
    id: string;
    body: string;
    created_utc: number;
    score: number;
    subreddit: string;
  }>;
}

export class RedditNormalizer extends AbstractNormalizer<RedditSearchResponse> {
  readonly toolName = 'reddit';

  normalize(
    rawOutput: RedditSearchResponse,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent {
    const startTime = Date.now();
    const event = this.createBaseEvent(target, traceId, investigationId);
    event.metadata.raw = rawOutput;

    const entity = this.createPersonEntity(rawOutput.user);
    event.entities.push(entity);

    const observations = this.createUserObservations(entity.id, rawOutput, traceId);
    event.observations.push(...observations);

    event.metadata.executionTime = Date.now() - startTime;
    return event;
  }

  private createPersonEntity(user: RedditUserData): EntityReference {
    const now = new Date();
    const accountAge = Date.now() - user.created_utc * 1000;

    return {
      id: this.generateId(),
      type: 'person',
      name: user.name,
      aliases: [`u/${user.name}`],
      confidence: this.calculateRedditConfidence(user),
      attributes: {
        reddit_id: user.id,
        username: user.name,
        link_karma: user.link_karma,
        comment_karma: user.comment_karma,
        total_karma: user.link_karma + user.comment_karma,
        is_verified: user.is_verified,
        is_mod: user.is_mod,
        account_age_days: Math.floor(accountAge / (1000 * 60 * 60 * 24)),
        created_utc: user.created_utc
      },
      sourceIds: [],
      firstSeen: new Date(user.created_utc * 1000),
      lastSeen: now,
      metadata: {
        verified: user.is_verified,
        tags: user.is_mod ? ['moderator'] : [],
        notes: `Reddit user: u/${user.name}`
      }
    };
  }

  private createUserObservations(entityId: string, data: RedditSearchResponse, traceId: string): Observation[] {
    const observations: Observation[] = [];
    const now = new Date();

    // Karma observation
    observations.push({
      id: this.generateId(),
      entityId,
      type: 'attribute',
      property: 'reputation_score',
      value: {
        platform: 'reddit',
        link_karma: data.user.link_karma,
        comment_karma: data.user.comment_karma,
        total: data.user.link_karma + data.user.comment_karma,
        reputation_tier: this.calculateReputationTier(data.user.link_karma + data.user.comment_karma)
      },
      confidence: 0.9,
      source: {
        tool: 'reddit',
        url: `https://reddit.com/user/${data.user.name}`,
        timestamp: now,
        raw: data.user
      },
      context: {}
    });

    // Activity analysis
    if (data.posts || data.comments) {
      const postCount = data.posts?.length || 0;
      const commentCount = data.comments?.length || 0;

      observations.push({
        id: this.generateId(),
        entityId,
        type: 'behavior',
        property: 'community_activity',
        value: {
          platform: 'reddit',
          recent_posts: postCount,
          recent_comments: commentCount,
          subreddits: this.extractSubreddits(data),
          activity_type: postCount > commentCount ? 'poster' : 'commenter'
        },
        confidence: 0.85,
        source: {
          tool: 'reddit',
          timestamp: now,
          raw: { posts: data.posts, comments: data.comments }
        },
        context: {
          sample_period: '7_days'
        }
      });
    }

    return observations;
  }

  private calculateRedditConfidence(user: RedditUserData): number {
    let confidence = 0.7;

    const totalKarma = user.link_karma + user.comment_karma;
    if (totalKarma > 10000) confidence += 0.1;
    if (user.is_verified) confidence += 0.1;
    if (user.is_mod) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  private calculateReputationTier(karma: number): string {
    if (karma > 100000) return 'high';
    if (karma > 10000) return 'medium';
    if (karma > 1000) return 'established';
    return 'new';
  }

  private extractSubreddits(data: RedditSearchResponse): string[] {
    const subreddits = new Set<string>();

    data.posts?.forEach(post => subreddits.add(post.subreddit));
    data.comments?.forEach(comment => subreddits.add(comment.subreddit));

    return Array.from(subreddits);
  }
}
