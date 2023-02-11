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
  semaphoreItems: Record<string, SemaphoreItem>
  max: number
  constructor(max = 1) {
    this.semaphoreItems = {}
    this.max = max
  }

  private _getSemaphoreInstance(key: string | number = defaultKey) {
    if (!this.semaphoreItems[key]) {
      this.semaphoreItems[key] = new SemaphoreItem(this.max)
    }
    return this.semaphoreItems[key]
  }

  private _tidy(key: string | number = defaultKey): void {
    if (this._getSemaphoreInstance(key).count == 0) {
      delete this.semaphoreItems[key]
    }
  }

  canAcquire(key: string | number = defaultKey): boolean {
    return this._getSemaphoreInstance(key).canAcquire
  }

  acquire(key: string | number = defaultKey) {
    return this._getSemaphoreInstance(key).acquire()
  }

  release(key: string | number = defaultKey): void {
    this._getSemaphoreInstance(key).release()
    this._tidy(key)
  }

  count(key: string | number = defaultKey): number {
    if (this.semaphoreItems[key]) {
      return this.semaphoreItems[key].count
    } else {
      return 0
    }
  }

  hasTasks(key: string | number = defaultKey): boolean {
    return this.count(key) > 0
  }

  /**
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key] - Optional, the semaphore key.
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
   * Executes `fn` if it can acauire the lock.  Returns `null` if a lock cannot
   * be acquired.
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key] - Optional, the semaphore key.
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
