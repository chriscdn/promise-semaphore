class SemaphoreItem {
  queue: Array<Function>
  max: number
  count: number

  constructor(max: number) {
    this.queue = []
    this.max = max
    this.count = 0
  }

  get canAcquire(): boolean {
    return this.count < this.max
  }

  acquire(): Promise<void> {
    if (this.canAcquire) {
      this.count++
      return Promise.resolve()
    } else {
      return new Promise((resolve) => this.queue.push(resolve))
    }
  }

  release(): void {
    const resolveFunc = this.queue.shift()

    if (resolveFunc) {
      // Give the micro task queue a small break instead of calling resolveFunc() directly
      setTimeout(resolveFunc, 0)
    } else {
      this.count--
    }
  }
}

const defaultKey = '_default'

class Semaphore {
  private semaphoreInstances: Record<string, SemaphoreItem>
  private max: number

  constructor(max: number = 1) {
    this.semaphoreInstances = {}
    this.max = max
  }

  private hasSemaphoreInstance(key: string | number = defaultKey) {
    return Boolean(this.semaphoreInstances[key])
  }

  private getSemaphoreInstance(key: string | number = defaultKey) {
    if (!this.hasSemaphoreInstance(key)) {
      this.semaphoreInstances[key] = new SemaphoreItem(this.max)
    }
    return this.semaphoreInstances[key]
  }

  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  private tidy(key: string | number = defaultKey): void {
    if (
      this.hasSemaphoreInstance(key) &&
      this.getSemaphoreInstance(key).count == 0
    ) {
      delete this.semaphoreInstances[key]
    }
  }

  /**
   * A synchronous function to determine whether a lock can be acquired.
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {boolean} Returns true if the lock on `key` can be acquired, false
   * otherwise.
   */
  canAcquire(key: string | number = defaultKey): boolean {
    return this.getSemaphoreInstance(key).canAcquire
  }

  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  acquire(key: string | number = defaultKey) {
    return this.getSemaphoreInstance(key).acquire()
  }

  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  release(key: string | number = defaultKey): void {
    this.getSemaphoreInstance(key).release()
    this.tidy(key)
  }

  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  count(key: string | number = defaultKey): number {
    if (this.hasSemaphoreInstance(key)) {
      return this.getSemaphoreInstance(key).count
    } else {
      return 0
    }
  }

  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {boolean} True if the semaphore and key has locks, false otherwise.
   */
  hasTasks(key: string | number = defaultKey): boolean {
    return this.count(key) > 0
  }

  /**
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {Promise<T>}
   */
  async request<T>(
    fn: Function,
    key: string | number = defaultKey
  ): Promise<T> {
    try {
      await this.acquire(key)
      return await fn()
    } finally {
      this.release(key)
    }
  }

  /**
   * Asynchronously executes `fn` if a lock can be immediately acquired.
   * Otherwise, returns null.
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {Promise<T>}
   */
  async requestIfAvailable<T>(
    fn: Function,
    key: string | number = defaultKey
  ): Promise<T | null> {
    if (this.canAcquire(key)) {
      return this.request(fn, key)
    } else {
      return null
    }
  }
}

export default Semaphore
