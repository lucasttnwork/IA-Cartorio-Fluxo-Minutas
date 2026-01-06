/**
 * WorkerMetrics - Tracks performance and operational metrics for the worker
 *
 * Maintains a rolling window of job statistics for monitoring and health checks.
 */
export interface JobMetric {
  jobId: string
  jobType: string
  startTime: number
  endTime: number
  durationMs: number
  success: boolean
  error?: string
}

export interface MetricsSummary {
  jobsProcessedLast60s: number
  averageJobDurationMs: number
  successRate: number
  jobsByType: Record<string, number>
  zombieJobsRecovered: number
  lastJobProcessedAt: string | null
}

export class WorkerMetrics {
  private jobHistory: JobMetric[] = []
  private readonly maxHistorySize = 1000
  private readonly rollingWindowMs = 60000 // 60 seconds
  private zombieRecoveryCount = 0
  private lastJobProcessedAt: Date | null = null

  /**
   * Record a completed job
   */
  recordJob(metric: Omit<JobMetric, 'durationMs'>): void {
    const fullMetric: JobMetric = {
      ...metric,
      durationMs: metric.endTime - metric.startTime,
    }

    this.jobHistory.push(fullMetric)
    this.lastJobProcessedAt = new Date(metric.endTime)

    // Trim history if too large
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory = this.jobHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Record zombie job recovery
   */
  recordZombieRecovery(count: number): void {
    this.zombieRecoveryCount += count
  }

  /**
   * Get jobs processed in the last N milliseconds
   */
  private getRecentJobs(windowMs: number = this.rollingWindowMs): JobMetric[] {
    const cutoff = Date.now() - windowMs
    return this.jobHistory.filter((job) => job.endTime > cutoff)
  }

  /**
   * Get summary of metrics
   */
  getSummary(): MetricsSummary {
    const recentJobs = this.getRecentJobs()

    // Calculate average duration
    const totalDuration = recentJobs.reduce((sum, job) => sum + job.durationMs, 0)
    const averageJobDurationMs = recentJobs.length > 0
      ? Math.round(totalDuration / recentJobs.length)
      : 0

    // Calculate success rate
    const successfulJobs = recentJobs.filter((job) => job.success).length
    const successRate = recentJobs.length > 0
      ? Math.round((successfulJobs / recentJobs.length) * 100)
      : 100

    // Count jobs by type
    const jobsByType: Record<string, number> = {}
    for (const job of recentJobs) {
      jobsByType[job.jobType] = (jobsByType[job.jobType] || 0) + 1
    }

    return {
      jobsProcessedLast60s: recentJobs.length,
      averageJobDurationMs,
      successRate,
      jobsByType,
      zombieJobsRecovered: this.zombieRecoveryCount,
      lastJobProcessedAt: this.lastJobProcessedAt?.toISOString() || null,
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.jobHistory = []
    this.zombieRecoveryCount = 0
    this.lastJobProcessedAt = null
  }
}

// Singleton instance
export const workerMetrics = new WorkerMetrics()

export default workerMetrics
