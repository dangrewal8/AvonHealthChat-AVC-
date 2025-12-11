/**
 * Job Queue Service
 * 
 * In-memory job queue for async query processing.
 * Handles long-running RAG queries without HTTP timeout issues.
 */

interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  created_at: Date;
  updated_at: Date;
  estimated_completion?: Date;
}

class JobQueueService {
  private jobs: Map<string, JobStatus> = new Map();
  private readonly JOB_EXPIRY_MS = 3600000; // 1 hour

  /**
   * Create a new job
   */
  createJob(jobId: string): JobStatus {
    const job: JobStatus = {
      job_id: jobId,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      estimated_completion: new Date(Date.now() + 120000), // 2 minutes estimate
    };
    
    this.jobs.set(jobId, job);
    console.log(`📋 Job created: ${jobId}`);
    
    // Auto-cleanup after 1 hour
    setTimeout(() => {
      this.jobs.delete(jobId);
      console.log(`🗑️  Job expired and removed: ${jobId}`);
    }, this.JOB_EXPIRY_MS);
    
    return job;
  }

  /**
   * Update job status
   */
  updateJob(jobId: string, updates: Partial<JobStatus>): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`❌ Job not found: ${jobId}`);
      return;
    }

    Object.assign(job, updates, { updated_at: new Date() });
    this.jobs.set(jobId, job);
    
    console.log(`📝 Job updated: ${jobId} - Status: ${job.status}`);
  }

  /**
   * Get job status
   */
  getJob(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Mark job as processing
   */
  markProcessing(jobId: string, progress?: number): void {
    this.updateJob(jobId, { status: 'processing', progress });
  }

  /**
   * Mark job as completed with result
   */
  markCompleted(jobId: string, result: any): void {
    this.updateJob(jobId, { status: 'completed', result, progress: 100 });
  }

  /**
   * Mark job as failed with error
   */
  markFailed(jobId: string, error: string): void {
    this.updateJob(jobId, { status: 'failed', error });
  }
}

export const jobQueue = new JobQueueService();
export type { JobStatus };
