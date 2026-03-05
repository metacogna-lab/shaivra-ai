import Bull, { Queue, Job } from 'bull';
import { searchUsername, type SherlockResult } from '../integrations/sherlock';
import { harvestDomain, type TheHarvesterResult } from '../integrations/theharvester';
import redis from '../db/redisClient';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create job queues
export const sherlockQueue: Queue<{ username: string }> = new Bull('sherlock', REDIS_URL, {
  limiter: {
    max: 5, // Max 5 jobs
    duration: 60000 // Per minute
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500 // Keep last 500 failed jobs
  }
});

export const theharvesterQueue: Queue<{ domain: string; source: string; limit: number }> = new Bull('theharvester', REDIS_URL, {
  limiter: {
    max: 3, // Max 3 jobs
    duration: 60000 // Per minute (TheHarvester is slower)
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

// Process Sherlock jobs
sherlockQueue.process(async (job: Job<{ username: string }>) => {
  const { username } = job.data;

  job.log(`Starting Sherlock search for username: ${username}`);

  try {
    await job.progress(10);

    const result = await searchUsername(username);

    await job.progress(90);

    job.log(`Sherlock found ${result.sites_with_username} sites for ${username}`);

    await job.progress(100);

    return result;
  } catch (error: any) {
    job.log(`Sherlock failed: ${error.message}`);
    throw error;
  }
});

// Process TheHarvester jobs
theharvesterQueue.process(async (job: Job<{ domain: string; source: string; limit: number }>) => {
  const { domain, source, limit } = job.data;

  job.log(`Starting TheHarvester for domain: ${domain} (source: ${source})`);

  try {
    await job.progress(10);

    const result = await harvestDomain(domain, source, limit);

    await job.progress(90);

    job.log(`TheHarvester found ${result.emails.length} emails, ${result.subdomains.length} subdomains`);

    await job.progress(100);

    return result;
  } catch (error: any) {
    job.log(`TheHarvester failed: ${error.message}`);
    throw error;
  }
});

// Event handlers for Sherlock queue
sherlockQueue.on('completed', (job, result) => {
  console.log(`[Sherlock Queue] Job ${job.id} completed for ${job.data.username}`);
});

sherlockQueue.on('failed', (job, err) => {
  console.error(`[Sherlock Queue] Job ${job?.id} failed:`, err.message);
});

sherlockQueue.on('stalled', (job) => {
  console.warn(`[Sherlock Queue] Job ${job.id} stalled`);
});

// Event handlers for TheHarvester queue
theharvesterQueue.on('completed', (job, result) => {
  console.log(`[TheHarvester Queue] Job ${job.id} completed for ${job.data.domain}`);
});

theharvesterQueue.on('failed', (job, err) => {
  console.error(`[TheHarvester Queue] Job ${job?.id} failed:`, err.message);
});

theharvesterQueue.on('stalled', (job) => {
  console.warn(`[TheHarvester Queue] Job ${job.id} stalled`);
});

/**
 * Queue a Sherlock username search
 */
export async function queueSherlockSearch(username: string): Promise<Job<{ username: string }>> {
  console.log(`[CLI Orchestrator] Queuing Sherlock search for: ${username}`);

  const job = await sherlockQueue.add(
    { username },
    {
      jobId: `sherlock-${username}-${Date.now()}`,
      priority: 1
    }
  );

  return job;
}

/**
 * Queue a TheHarvester domain harvest
 */
export async function queueTheHarvesterSearch(
  domain: string,
  source: string = 'google',
  limit: number = 500
): Promise<Job<{ domain: string; source: string; limit: number }>> {
  console.log(`[CLI Orchestrator] Queuing TheHarvester for: ${domain} (source: ${source})`);

  const job = await theharvesterQueue.add(
    { domain, source, limit },
    {
      jobId: `theharvester-${domain}-${source}-${Date.now()}`,
      priority: 1
    }
  );

  return job;
}

/**
 * Get job status
 */
export async function getJobStatus(queue: Queue, jobId: string): Promise<any> {
  const job = await queue.getJob(jobId);

  if (!job) {
    return { error: 'Job not found' };
  }

  const state = await job.getState();
  const progress = await job.progress();
  const logs = await queue.getJobLogs(jobId, 0, -1);

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    result: job.returnvalue,
    logs: logs?.logs ?? [],
    created_at: job.timestamp,
    processed_at: job.processedOn,
    finished_at: job.finishedOn,
    failed_reason: job.failedReason,
    attempts_made: job.attemptsMade,
    attempts_max: job.opts.attempts
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queue: Queue): Promise<any> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return {
    name: queue.name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Clear completed jobs older than N milliseconds
 */
export async function cleanQueue(queue: Queue, olderThan: number = 86400000): Promise<number> {
  const jobs = await queue.clean(olderThan, 'completed');
  console.log(`[CLI Orchestrator] Cleaned ${jobs.length} completed jobs from ${queue.name}`);
  return jobs.length;
}

/**
 * Graceful shutdown
 */
export async function shutdownQueues(): Promise<void> {
  console.log('[CLI Orchestrator] Shutting down job queues...');

  await Promise.all([
    sherlockQueue.close(),
    theharvesterQueue.close()
  ]);

  console.log('[CLI Orchestrator] Job queues shut down successfully');
}
