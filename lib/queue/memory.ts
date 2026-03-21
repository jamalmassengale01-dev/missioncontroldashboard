import { Job, JobHandler, JobQueue, JobResult } from './base';

interface QueuedJob extends Job {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: JobResult;
  processedAt?: Date;
  error?: string;
}

export class MemoryQueue implements JobQueue {
  private jobs: Map<string, QueuedJob> = new Map();
  private pendingJobs: string[] = [];
  private handler?: JobHandler;
  private isProcessing = false;
  private isPaused = false;
  private processingPromise?: Promise<void>;

  async add(job: Job): Promise<string> {
    const id = job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedJob: QueuedJob = {
      ...job,
      id,
      status: 'pending',
      createdAt: job.createdAt || new Date(),
      priority: job.priority || 0,
      retries: job.retries || 3,
    };

    this.jobs.set(id, queuedJob);

    // Insert into pending queue sorted by priority
    this.insertByPriority(id, queuedJob.priority || 0);

    // Start processing if handler is set
    if (this.handler && !this.isProcessing && !this.isPaused) {
      this.processQueue();
    }

    // Handle delayed jobs
    if (job.delay && job.delay > 0) {
      setTimeout(() => {
        this.processQueue();
      }, job.delay);
    }

    return id;
  }

  process(handler: JobHandler): void {
    this.handler = handler;
    if (!this.isProcessing && !this.isPaused) {
      this.processQueue();
    }
  }

  async getJob(id: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    return job || null;
  }

  async remove(id: string): Promise<void> {
    this.jobs.delete(id);
    const index = this.pendingJobs.indexOf(id);
    if (index > -1) {
      this.pendingJobs.splice(index, 1);
    }
  }

  async getQueueDepth(): Promise<number> {
    return this.pendingJobs.length;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    if (this.handler && !this.isProcessing) {
      this.processQueue();
    }
  }

  async clear(): Promise<void> {
    this.jobs.clear();
    this.pendingJobs = [];
  }

  private insertByPriority(jobId: string, priority: number): void {
    // Higher priority = earlier in queue
    const index = this.pendingJobs.findIndex((id) => {
      const job = this.jobs.get(id);
      return (job?.priority || 0) < priority;
    });

    if (index === -1) {
      this.pendingJobs.push(jobId);
    } else {
      this.pendingJobs.splice(index, 0, jobId);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused || !this.handler) return;

    this.isProcessing = true;

    while (this.pendingJobs.length > 0 && !this.isPaused) {
      const jobId = this.pendingJobs.shift();
      if (!jobId) continue;

      const job = this.jobs.get(jobId);
      if (!job) continue;

      // Check if job should be delayed
      if (job.delay && job.createdAt) {
        const elapsed = Date.now() - job.createdAt.getTime();
        if (elapsed < job.delay) {
          // Put back in queue and wait
          this.pendingJobs.unshift(jobId);
          const remainingDelay = job.delay - elapsed;
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
          continue;
        }
      }

      job.status = 'processing';
      job.processedAt = new Date();

      try {
        const result = await this.handler(job);
        job.status = 'completed';
        job.result = {
          success: true,
          data: result,
          completedAt: new Date(),
        };
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.result = {
          success: false,
          error: job.error,
          completedAt: new Date(),
        };

        // Retry logic
        if ((job.retries || 0) > 0) {
          job.retries!--;
          job.status = 'pending';
          this.pendingJobs.push(jobId);
        }
      }
    }

    this.isProcessing = false;
  }

  // Get all jobs (for debugging)
  getAllJobs(): QueuedJob[] {
    return Array.from(this.jobs.values());
  }

  // Get jobs by status
  getJobsByStatus(status: QueuedJob['status']): QueuedJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status);
  }
}

// Export singleton instance
export const memoryQueue = new MemoryQueue();

// Re-export types
export type { JobQueue };
