'use strict';

class SemaphoreItem {
  queue;
  max;
  count;
  constructor(max) {
    this.queue = [];
    this.max = max;
    this.count = 0;
  }
  get canAcquire() {
    return this.count < this.max;
  }
  acquire() {
    if (this.canAcquire) {
      this.count++;
      return Promise.resolve();
    } else {
      return new Promise((resolve) => this.queue.push(resolve));
    }
  }
  release() {
    const resolveFunc = this.queue.shift();
    if (resolveFunc) {
      setTimeout(resolveFunc, 0);
    } else {
      this.count--;
    }
  }
}
const defaultKey = "_default";
class Semaphore {
  semaphoreInstances;
  max;
  constructor(max = 1) {
    this.semaphoreInstances = {};
    this.max = max;
  }
  hasSemaphoreInstance(key = defaultKey) {
    return Boolean(this.semaphoreInstances[key]);
  }
  getSemaphoreInstance(key = defaultKey) {
    if (!this.hasSemaphoreInstance(key)) {
      this.semaphoreInstances[key] = new SemaphoreItem(this.max);
    }
    return this.semaphoreInstances[key];
  }
  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  tidy(key = defaultKey) {
    if (this.hasSemaphoreInstance(key) && this.getSemaphoreInstance(key).count == 0) {
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
  canAcquire(key = defaultKey) {
    return this.getSemaphoreInstance(key).canAcquire;
  }
  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  acquire(key = defaultKey) {
    return this.getSemaphoreInstance(key).acquire();
  }
  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  release(key = defaultKey) {
    this.getSemaphoreInstance(key).release();
    this.tidy(key);
  }
  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  count(key = defaultKey) {
    if (this.hasSemaphoreInstance(key)) {
      return this.getSemaphoreInstance(key).count;
    } else {
      return 0;
    }
  }
  /**
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {boolean} True if the semaphore and key has locks, false otherwise.
   */
  hasTasks(key = defaultKey) {
    return this.count(key) > 0;
  }
  /**
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {Promise<T>}
   */
  async request(fn, key = defaultKey) {
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
  async requestIfAvailable(fn, key = defaultKey) {
    if (this.canAcquire(key)) {
      return this.request(fn, key);
    } else {
      return null;
    }
  }
}

module.exports = Semaphore;
