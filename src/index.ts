class SemaphoreItem {
  private queue: Array<Function>;
  private waitQueue: Array<Function>;
  private maxConcurrent: number;

  /**
   * The number of locks.
   */
  public count: number;

  constructor(maxConcurrent: number) {
    this.queue = [];
    this.waitQueue = [];
    this.maxConcurrent = maxConcurrent;
    this.count = 0;
  }

  get canAcquire(): boolean {
    return this.count < this.maxConcurrent;
  }

  private incrementCount() {
    this.count++;
  }

  private decrementCount() {
    this.count--;

    if (this.count === 0) {
      this.waitQueue.forEach((resolve) => resolve());
      this.waitQueue = [];
    }
  }

  acquire(): Promise<void> {
    if (this.canAcquire) {
      this.incrementCount();
      return Promise.resolve();
    } else {
      return new Promise((resolve) => this.queue.push(resolve));
    }
  }

  release(): void {
    const resolveFunc = this.queue.shift();

    if (resolveFunc) {
      // Give the micro task queue a small break instead of calling resolveFunc() directly
      setTimeout(resolveFunc, 0);
    } else {
      this.decrementCount();
    }
  }

  wait(): Promise<void> {
    return new Promise((resolve) => this.waitQueue.push(resolve));
  }
}

const defaultKey = "_default";

class Semaphore {
  private semaphoreInstances: Record<string | number, SemaphoreItem>;
  private maxConcurrent: number;

  /**
   * @param {number} [maxConcurrent] The maximum number of concurrent locks.
   */
  constructor(maxConcurrent: number = 1) {
    this.semaphoreInstances = {};
    this.maxConcurrent = maxConcurrent;
  }

  private hasSemaphoreInstance(key: string | number = defaultKey) {
    return Boolean(this.semaphoreInstances[key]);
  }

  private getSemaphoreInstance(key: string | number = defaultKey) {
    if (!this.hasSemaphoreInstance(key)) {
      this.semaphoreInstances[key] = new SemaphoreItem(this.maxConcurrent);
    }
    return this.semaphoreInstances[key];
  }

  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  private tidy(key: string | number = defaultKey): void {
    if (
      this.hasSemaphoreInstance(key) &&
      this.getSemaphoreInstance(key).count === 0
    ) {
      delete this.semaphoreInstances[key];
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
    return this.getSemaphoreInstance(key).canAcquire;
  }

  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  acquire(key: string | number = defaultKey) {
    return this.getSemaphoreInstance(key).acquire();
  }

  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  release(key: string | number = defaultKey): void {
    this.getSemaphoreInstance(key).release();
    this.tidy(key);
  }

  /**
   * The number of active locks.  Will always be less or equal to `max`.
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  count(key: string | number = defaultKey): number {
    if (this.hasSemaphoreInstance(key)) {
      return this.getSemaphoreInstance(key).count;
    } else {
      return 0;
    }
  }

  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {boolean} True if the semaphore and key has locks, false otherwise.
   */
  hasTasks(key: string | number = defaultKey): boolean {
    return this.count(key) > 0;
  }

  /**
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {Promise<T>}
   */
  async request<T>(
    fn: Function,
    key: string | number = defaultKey,
  ): Promise<T> {
    try {
      await this.acquire(key);
      return await fn();
    } finally {
      this.release(key);
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
    key: string | number = defaultKey,
  ): Promise<T | null> {
    if (this.canAcquire(key)) {
      return this.request(fn, key);
    } else {
      return null;
    }
  }

  /**
   * Wait until the count on `key` is 0 and then resolve.
   *
   * @param key
   * @returns
   */
  async wait(key: string | number = defaultKey) {
    if (this.hasTasks(key)) {
      return this.getSemaphoreInstance(key).wait();
    } else {
      return Promise.resolve();
    }
  }

  // globalCount() {
  //   return Object.values(this.semaphoreInstances).reduce(
  //     (a, instance) => a + instance.count,
  //     0,
  //   );
  // }
}

export default Semaphore;
export { Semaphore };
