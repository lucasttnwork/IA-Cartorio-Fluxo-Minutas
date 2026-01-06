/**
 * Semaphore implementation for controlling concurrent job execution
 *
 * This class provides a way to limit the number of concurrent operations
 * by requiring acquisition of a permit before proceeding.
 */
export class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  /**
   * Acquire a permit, waiting if none are available
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve)
    })
  }

  /**
   * Release a permit, allowing waiting operations to proceed
   */
  release(): void {
    this.permits++
    if (this.waiting.length > 0 && this.permits > 0) {
      this.permits--
      const next = this.waiting.shift()
      if (next) {
        next()
      }
    }
  }

  /**
   * Get current number of available permits
   */
  availablePermits(): number {
    return this.permits
  }

  /**
   * Get number of operations waiting for a permit
   */
  waitingCount(): number {
    return this.waiting.length
  }
}

export default Semaphore
