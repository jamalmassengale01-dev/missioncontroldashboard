import { Job, JobHandler, JobQueue, JobResult } from './base';
import { Queue, Worker, Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';

interface BullConfig {
  redis: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  queueName?: string;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type?: 'fixed' | 'exponential';
      delay?: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

interface BullJobData {
  jobId: string;
  type: string;
  payload: unknown;
  priority: number;
  retries: number;
  createdAt: string;
}

export class BullQueue implements JobQueue {
  private queue: any;
  private worker?: any;
  private handler?: JobHandler;
  private redis: IORedis;
  private config: BullConfig;

  constructor(config: BullConfig) {
    this.config = config;
    this.redis = new IORedis({
      host: config.redis.host || 'localhost',
      port: config.redis.port || 6379,
      password: config.redis.password,
      db: config.redis.db || 0,
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue(config.queueName || 'mission-control', {
      connection: {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
      },
      defaultJobOptions: {
        attempts: config.defaultJobOptions?.attempts || 3,
        backoff: {
          type: config.defaultJobOptions?.backoff?.type || 'exponential',
          delay: config.defaultJobOptions?.backoff?.delay || 1000,
        },
        removeOnComplete: config.defaultJobOptions?.removeOnComplete ?? 100,
        removeOnFail: config.defaultJobOptions?.removeOnFail ?? 50,
      },
    });
  }

  async add(job: Job): Promise<string> {
    const bullJob = await this.queue.add(
      job.type,
      {
        jobId: job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: job.type,
        payload: job.payload,
        priority: job.priority || 0,
        retries: job.retries || 3,
        createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
      },
      {
        jobId: job.id,
        priority: job.priority,
        delay: job.delay,
      }
    );

    return bullJob.id || '';
  }

  process(handler: JobHandler): void {
    this.handler = handler;

    this.worker = new Worker(
      this.config.queueName || 'mission-control',
      async (bullJob) => {
        const job: Job = {
          id: bullJob.data.jobId,
          type: bullJob.data.type,
          payload: bullJob.data.payload,
          priority: bullJob.data.priority,
          retries: bullJob.data.retries,
          createdAt: new Date(bullJob.data.createdAt),
        };

        return await handler(job);
      },
      {
        connection: {
          host: this.config.redis.host || 'localhost',
          port: this.config.redis.port || 6379,
          password: this.config.redis.password,
          db: this.config.redis.db || 0,
        },
        concurrency: 5,
      }
    );

    // Handle worker events
    this.worker.on('completed', (job: any) => {
      console.log(`[BullQueue] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job: any, err: Error) => {
      console.error(`[BullQueue] Job ${job?.id} failed:`, err);
    });
  }

  async getJob(id: string): Promise<Job | null> {
    const bullJob = await this.queue.getJob(id);
    if (!bullJob) return null;

    return {
      id: bullJob.data.jobId,
      type: bullJob.data.type,
      payload: bullJob.data.payload,
      priority: bullJob.data.priority,
      retries: bullJob.data.retries,
      createdAt: new Date(bullJob.data.createdAt),
    };
  }

  async remove(id: string): Promise<void> {
    const bullJob = await this.queue.getJob(id);
    if (bullJob) {
      await bullJob.remove();
    }
  }

  async getQueueDepth(): Promise<number> {
    const waiting = await this.queue.getWaitingCount();
    const delayed = await this.queue.getDelayedCount();
    return waiting + delayed;
  }

  pause(): void {
    this.worker?.pause();
  }

  resume(): void {
    this.worker?.resume();
  }

  async clear(): Promise<void> {
    await this.queue.obliterate({ force: true });
  }

  // Additional Bull-specific methods
  async getJobCounts(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    return await this.queue.getJobCounts();
  }

  async close(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

// Factory function to create Bull queue
export function createBullQueue(config: BullConfig): BullQueue {
  return new BullQueue(config);
}
