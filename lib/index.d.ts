declare class SemaphoreItem {
    queue: Array<Function>;
    max: number;
    count: number;
    constructor(max: number);
    get canAcquire(): boolean;
    acquire(): Promise<void>;
    release(): void;
}
declare class Semaphore {
    semaphoreItems: Record<string, SemaphoreItem>;
    max: number;
    constructor(max?: number);
    private _getSemaphoreInstance;
    private _tidy;
    canAcquire(key?: string | number): boolean;
    acquire(key?: string | number): Promise<void>;
    release(key?: string | number): void;
    count(key?: string | number): number;
    hasTasks(key?: string | number): boolean;
    /**
     *
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key] - Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    request<T>(fn: Function, key?: string | number): Promise<T>;
    /**
     * Executes `fn` if it can acauire the lock.  Returns `null` if a lock cannot
     * be acquired.
     *
     * @param {Function<T>} fn The function to execute.
     * @param {string | number} [key] - Optional, the semaphore key.
     * @returns {Promise<T>}
     */
    requestIfAvailable<T>(fn: Function, key?: string | number): Promise<T | null>;
}

export { Semaphore as default };
