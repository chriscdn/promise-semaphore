import { Semaphore } from "./semaphore";

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
class GroupSemaphore {
    private _semaphore = new Semaphore();
    private _activeCounts: Record<string, number> = {};
    private _groupWaiters: Record<string, Promise<void>> = {};

    async acquire(key: string) {
        const activeCount = this._activeCounts[key] ?? 0;
        this._activeCounts[key] = activeCount + 1;
        const waiter = this._groupWaiters[key] ?? this._semaphore.acquire();
        this._groupWaiters[key] = waiter;
        await waiter;
    }

    release(key: string) {
        const activeCount = this._activeCounts[key];

        if (activeCount === 1) {
            this._semaphore.release();
            delete this._activeCounts[key];
            delete this._groupWaiters[key];
        } else {
            this._activeCounts[key] = activeCount - 1;
        }
    }
}

export { GroupSemaphore };
