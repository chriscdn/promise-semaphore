/**
 * GroupSemaphore is a concurrency control mechanism that manages a shared
 * semaphore for different groups of tasks. Each group is identified by a unique
 * key, and the semaphore ensures only one group can run its tasks concurrently.
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
export { GroupSemaphore };
