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
export { Semaphore };
