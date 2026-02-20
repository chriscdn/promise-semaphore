"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  GroupSemaphore: () => GroupSemaphore,
  Semaphore: () => Semaphore
});
module.exports = __toCommonJS(index_exports);

// src/semaphore.ts
var defaultKey = "_default";
var _isPrimitiveKey = (item) => ["string", "number"].includes(typeof item);
var resolveKey = (item) => (_isPrimitiveKey(item) ? item : item.key) ?? defaultKey;
var resolvePriority = (item) => (_isPrimitiveKey(item) ? 0 : item.priority) ?? 0;
var SemaphoreItem = class {
  queue;
  maxConcurrent;
  /**
   * The number of locks.
   */
  count;
  constructor(maxConcurrent) {
    this.queue = [];
    this.maxConcurrent = maxConcurrent;
    this.count = 0;
  }
  get canAcquire() {
    return this.count < this.maxConcurrent;
  }
  incrementCount() {
    this.count++;
  }
  decrementCount() {
    this.count--;
  }
  acquire(priority) {
    if (this.canAcquire) {
      this.incrementCount();
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.queue.push({ resolve, priority });
        this.queue.sort((a, b) => b.priority - a.priority);
      });
    }
  }
  release() {
    const resolveFunc = this.queue.shift();
    if (resolveFunc) {
      setTimeout(resolveFunc.resolve, 0);
    } else {
      this.decrementCount();
    }
  }
};
var Semaphore = class {
  semaphoreInstances;
  maxConcurrent;
  /**
   * @param {number} [maxConcurrent] The maximum number of concurrent locks.
   */
  constructor(maxConcurrent = 1) {
    this.semaphoreInstances = {};
    this.maxConcurrent = maxConcurrent;
    if (maxConcurrent < 1) {
      throw new Error("The maxConcurrent must be 1 or greater.");
    }
  }
  hasSemaphoreInstance(key = defaultKey) {
    return Boolean(this.semaphoreInstances[key]);
  }
  getSemaphoreInstance(key = defaultKey) {
    if (!this.hasSemaphoreInstance(key)) {
      this.semaphoreInstances[key] = new SemaphoreItem(
        this.maxConcurrent
      );
    }
    return this.semaphoreInstances[key];
  }
  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  tidy(key = defaultKey) {
    if (this.hasSemaphoreInstance(key) && this.getSemaphoreInstance(key).count === 0) {
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
    const _key = resolveKey(key);
    return !this.hasSemaphoreInstance(_key) || this.getSemaphoreInstance(_key).canAcquire;
  }
  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  acquire(key = defaultKey) {
    const _key = resolveKey(key);
    const _priority = resolvePriority(key);
    return this.getSemaphoreInstance(_key).acquire(_priority);
  }
  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  release(key = defaultKey) {
    const _key = resolveKey(key);
    this.getSemaphoreInstance(_key).release();
    this.tidy(_key);
  }
  /**
   * The number of active locks.  Will always be less or equal to `max`.
   *
   * @param {string | number} [key]- Optional, the semaphore key.
   */
  count(key = defaultKey) {
    const _key = resolveKey(key);
    return this.hasSemaphoreInstance(_key) ? this.getSemaphoreInstance(_key).count : 0;
  }
  /**
   * @param {string | number} [key]- Optional, the semaphore key.
   * @returns {boolean} True if the semaphore and key has locks, false otherwise.
   */
  hasTasks(key = defaultKey) {
    return this.count(key) > 0;
  }
  /**
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
};

// src/group-semaphore.ts
var GroupSemaphore = class {
  _semaphore = new Semaphore();
  _activeCounts = {};
  _groupWaiters = {};
  async acquire(key) {
    const activeCount = this._activeCounts[key] ?? 0;
    this._activeCounts[key] = activeCount + 1;
    const waiter = this._groupWaiters[key] ?? this._semaphore.acquire();
    this._groupWaiters[key] = waiter;
    await waiter;
  }
  release(key) {
    const activeCount = this._activeCounts[key];
    if (activeCount === 1) {
      this._semaphore.release();
      delete this._activeCounts[key];
      delete this._groupWaiters[key];
    } else {
      this._activeCounts[key] = activeCount - 1;
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GroupSemaphore,
  Semaphore
});
//# sourceMappingURL=index.cjs.map