const defaultKey = "_default";

type KeyPrimitive = string | number;

type Key = KeyPrimitive | { key?: KeyPrimitive };
type KeyOptions = Key & { priority?: number };

const _isPrimitiveKey = (item: Key): item is KeyPrimitive =>
    ["string", "number"].includes(typeof item);

const resolveKey = (item: Key): KeyPrimitive =>
    (_isPrimitiveKey(item) ? item : item.key) ?? defaultKey;

const resolvePriority = (item: KeyOptions) =>
    (_isPrimitiveKey(item) ? 0 : item.priority) ?? 0;

class SemaphoreItem {
    private queue: Array<{
        resolve: Function;
        priority: number;
    }>;
    private maxConcurrent: number;

    /**
     * The number of locks.
     */
    public count: number;

    constructor(maxConcurrent: number) {
        this.queue = [];
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
    }

    acquire(priority: number): Promise<void> {
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

    release(): void {
        const resolveFunc = this.queue.shift();

        if (resolveFunc) {
            // Give the micro task queue a small break instead of calling resolveFunc() directly
            setTimeout(resolveFunc.resolve, 0);
            // queueMicrotask(() => resolveFunc.resolve());
        } else {
            this.decrementCount();
        }
    }
}

class Semaphore {
    private semaphoreInstances: Record<string | number, SemaphoreItem>;
    private maxConcurrent: number;

    /**
     * @param {number} [maxConcurrent] The maximum number of concurrent locks.
     */
    constructor(maxConcurrent: number = 1) {
        this.semaphoreInstances = {};
        this.maxConcurrent = maxConcurrent;

        if (maxConcurrent < 1) {
            throw new Error("The maxConcurrent must be 1 or greater.");
        }
    }

    private hasSemaphoreInstance(key: KeyPrimitive = defaultKey) {
        return Boolean(this.semaphoreInstances[key]);
    }

    private getSemaphoreInstance(key: KeyPrimitive = defaultKey) {
        if (!this.hasSemaphoreInstance(key)) {
            this.semaphoreInstances[key] = new SemaphoreItem(
                this.maxConcurrent,
            );
        }
        return this.semaphoreInstances[key] as SemaphoreItem;
    }

    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    private tidy(key: KeyPrimitive = defaultKey): void {
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
    canAcquire(key: Key = defaultKey): boolean {
        const _key = resolveKey(key);

        return !this.hasSemaphoreInstance(_key) ||
            this.getSemaphoreInstance(_key).canAcquire;
    }

    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    acquire(key: KeyOptions = defaultKey) {
        const _key = resolveKey(key);
        const _priority = resolvePriority(key);

        return this.getSemaphoreInstance(_key).acquire(_priority);
    }

    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    release(key: Key = defaultKey): void {
        const _key = resolveKey(key);

        this.getSemaphoreInstance(_key).release();
        this.tidy(_key);
    }

    /**
     * The number of active locks.  Will always be less or equal to `max`.
     *
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    count(key: Key = defaultKey): number {
        const _key = resolveKey(key);

        return (this.hasSemaphoreInstance(_key))
            ? this.getSemaphoreInstance(_key).count
            : 0;
    }

    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {boolean} True if the semaphore and key has locks, false otherwise.
     */
    hasTasks(key: Key = defaultKey): boolean {
        return this.count(key) > 0;
    }

    /**
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    async request<T>(
        fn: Function,
        key: KeyOptions = defaultKey,
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
        key: KeyOptions = defaultKey,
    ): Promise<T | null> {
        if (this.canAcquire(key)) {
            return this.request(fn, key);
        } else {
            return null;
        }
    }
}

export { Semaphore };
