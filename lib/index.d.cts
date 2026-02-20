type KeyPrimitive = string | number;
type Key = KeyPrimitive | {
    key?: KeyPrimitive;
};
type KeyOptions = Key & {
    priority?: number;
};
declare class Semaphore {
    private semaphoreInstances;
    private maxConcurrent;
    /**
     * @param {number} [maxConcurrent] The maximum number of concurrent locks.
     */
    constructor(maxConcurrent?: number);
    private hasSemaphoreInstance;
    private getSemaphoreInstance;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    private tidy;
    /**
     * A synchronous function to determine whether a lock can be acquired.
     *
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {boolean} Returns true if the lock on `key` can be acquired, false
     * otherwise.
     */
    canAcquire(key?: Key): boolean;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    acquire(key?: KeyOptions): Promise<void>;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    release(key?: Key): void;
    /**
     * The number of active locks.  Will always be less or equal to `max`.
     *
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    count(key?: Key): number;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {boolean} True if the semaphore and key has locks, false otherwise.
     */
    hasTasks(key?: Key): boolean;
    /**
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    request<T>(fn: Function, key?: KeyOptions): Promise<T>;
    /**
     * Asynchronously executes `fn` if a lock can be immediately acquired.
     * Otherwise, returns null.
     *
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    requestIfAvailable<T>(fn: Function, key?: KeyOptions): Promise<T | null>;
}

/**
 * GroupSemaphore manages a shared semaphore for different groups of tasks. Each
 * group is identified by a unique key, and the semaphore ensures only one group
 * can run its tasks concurrently.
 *
 * - acquire(key): Increments the active count for the given group. If it's the
 *   first task for the group (active count is 0), it acquires the global
 *   semaphore, ensuring only one group's tasks can proceed at a time.
 *   Subsequent calls in the group increment the count and are permitted to run.
 * - release(key): Decrements the active count for the group. If the last task
 *   for that group is released, it releases the global semaphore, allowing
 *   other groups to proceed.
 *
 * This ensures that only one group can execute concurrently, but multiple tasks
 * within the same group can run as long as no other tasks from different groups
 * are active.
 */
declare class GroupSemaphore {
    private _semaphore;
    private _activeCounts;
    private _groupWaiters;
    acquire(key: string): Promise<void>;
    release(key: string): void;
}

export { GroupSemaphore, Semaphore };
