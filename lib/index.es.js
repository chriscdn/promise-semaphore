class SemaphoreItem {
  constructor(max) {
    this.queue = [];
    this.max = max;
    this.count = 0;
  }

  get canAcquire() {
    return this.count < this.max
  }

  acquire() {
    if (this.canAcquire) {
      this.count++;
        return Promise.resolve()
    } else {
      return new Promise((resolve) => {
        this.queue.push(resolve);
      })
    }
  }

  release() {
    const resolveFunc = this.queue.shift();

    if (resolveFunc) {
      // Give the micro task queue a small break instead of calling resolveFunc() directly
      setTimeout(resolveFunc, 0);
    } else {
      this.count--;
    }
  }
}

const defaultKey = '_default';

class Semaphore {
  constructor(max = 1) {
    this.semaphoreItems = {};
    this.max = max;
  }

  _getSemaphoreInstance(key = defaultKey) {
    if (!this.semaphoreItems[key]) {
      this.semaphoreItems[key] = new SemaphoreItem(this.max);
    }
    return this.semaphoreItems[key]
  }

  _tidy(key = defaultKey) {
    if (this._getSemaphoreInstance(key).count == 0) {
      delete this.semaphoreItems[key];
    }
  }

  canAcquire(key = defaultKey) {
    return this._getSemaphoreInstance(key).canAcquire
  }

  acquire(key = defaultKey) {
    return this._getSemaphoreInstance(key).acquire()
  }

  release(key = defaultKey) {
    this._getSemaphoreInstance(key).release();
    this._tidy(key);
  }

  count(key = defaultKey) {
    if (this.semaphoreItems[key]) {
      return this.semaphoreItems[key].count
    } else {
      return 0
    }
  }

  hasTasks(key = defaultKey) {
    return this.count(key) > 0
  }

  async request(fn, key = defaultKey) {
    try {
      await this.acquire(key);
      return await fn()
    } finally {
      this.release(key);
    }
  }

  async requestIfAvailable(fn, key = defaultKey) {
    if (this.canAcquire(key)) {
      return this.request(fn, key)
    } else {
      // Use canAcquire if you need to know if a function will be dismissed due
      // to an existing lock.
      return null
    }
  }
}

var src = Semaphore;

export default src;
