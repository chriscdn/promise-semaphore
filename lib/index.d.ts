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
    canAcquire(key?: string | number): boolean;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    acquire(key?: string | number): Promise<void>;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    release(key?: string | number): void;
    /**
     * The number of active locks.  Will always be less or equal to `max`.
     *
     * @param {string | number} [key]- Optional, the semaphore key.
     */
    count(key?: string | number): number;
    /**
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {boolean} True if the semaphore and key has locks, false otherwise.
     */
    hasTasks(key?: string | number): boolean;
    /**
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    request<T>(fn: Function, key?: string | number): Promise<T>;
    /**
     * Asynchronously executes `fn` if a lock can be immediately acquired.
     * Otherwise, returns null.
     *
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key]- Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    requestIfAvailable<T>(fn: Function, key?: string | number): Promise<T | null>;
    wait(key?: string | number): Promise<void>;
}
export default Semaphore;
