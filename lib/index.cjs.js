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
  semaphoreItems;
  max;
  constructor(max = 1) {
    this.semaphoreItems = {};
    this.max = max;
  }
  _getSemaphoreInstance(key = defaultKey) {
    if (!this.semaphoreItems[key]) {
      this.semaphoreItems[key] = new SemaphoreItem(this.max);
    }
    return this.semaphoreItems[key];
  }
  _tidy(key = defaultKey) {
    if (this._getSemaphoreInstance(key).count == 0) {
      delete this.semaphoreItems[key];
    }
  }
  canAcquire(key = defaultKey) {
    return this._getSemaphoreInstance(key).canAcquire;
  }
  acquire(key = defaultKey) {
    return this._getSemaphoreInstance(key).acquire();
  }
  release(key = defaultKey) {
    this._getSemaphoreInstance(key).release();
    this._tidy(key);
  }
  count(key = defaultKey) {
    if (this.semaphoreItems[key]) {
      return this.semaphoreItems[key].count;
    } else {
      return 0;
    }
  }
  hasTasks(key = defaultKey) {
    return this.count(key) > 0;
  }
  /**
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key] - Optional, the semaphore key.
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
   * Executes `fn` if it can acauire the lock.  Returns `null` if a lock cannot
   * be acquired.
   *
   * @param {Function<T>} fn The function to execute.
   * @param {string | number} [key] - Optional, the semaphore key.
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
