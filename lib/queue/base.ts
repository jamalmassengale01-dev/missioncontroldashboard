export interface Job {
  id: string;
  type: string;
  payload: any;
  priority?: number;
  delay?: number;
  retries?: number;
  createdAt?: Date;
}

export interface JobHandler<T = any> {
  (job: Job): Promise<T>;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  completedAt?: Date;
}

export interface JobQueue {
  add(job: Job): Promise<string>;
  process(handler: JobHandler): void;
  getJob(id: string): Promise<Job | null>;
  remove(id: string): Promise<void>;
  getQueueDepth(): Promise<number>;
  pause(): void;
  resume(): void;
  clear(): Promise<void>;
}
