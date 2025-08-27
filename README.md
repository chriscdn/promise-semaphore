# @chriscdn/promise-semaphore

Limit or throttle the concurrent execution of asynchronous code in separate
iterations of the event loop.

## Installing

Using npm:

```bash
npm install @chriscdn/promise-semaphore
```

Using yarn:

```bash
yarn add @chriscdn/promise-semaphore
```

## Version 3

Version 3 introduces two main changes:

- A new `GroupSemaphore` class has been added. It allows multiple tasks within the same group (identified by a key) to run concurrently while ensuring that only one group's tasks are active at a time. See below for documentation.
- The default export has been replaced with a named export.

Change:

```ts
import Semaphore from "@chriscdn/promise-semaphore";
```

to:

```ts
import { Semaphore } from "@chriscdn/promise-semaphore";
```

## API - Semaphore

### Create an instance

```ts
import { Semaphore } from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore([maxConcurrent]);
```

The `maxConcurrent` parameter is optional and defaults to `1` (making it an exclusive lock or _binary semaphore_). An integer greater than `1` can be used to allow multiple concurrent executions from separate iterations of the event loop.

### Acquire a lock

```ts
semaphore.acquire([options]);
```

This method returns a `Promise` that resolves when the lock is acquired.

The `options` parameter is optional and can be:

- A **key** (`string` or `number`): This lets a single Semaphore instance manage locks in different contexts (see the second example for `key` usage).
- An **object** with the following properties (all optional):
  - `key` (`string` or `number`): Functions the same as above.
  - `priority` (`number`): Determines the order in which queued requests are processed. Higher values are processed first.

### Release a lock

```ts
semaphore.release([key]);
```

The `release` method should be called within a `finally` block (whether using promises or a `try/catch` block) to ensure the lock is released. It's crucial to call `release` with the same `key` the lock was acquired with.

### Check if a lock can be acquired

```ts
semaphore.canAcquire([key]);
```

This synchronous method returns `true` if a lock can be immediately acquired, and `false` otherwise.

### `count`

```ts
semaphore.count([key]);
```

This function is synchronous, and returns the current number of locks.

### `request` method

```ts
const results = await semaphore.request(fn [, options]);
```

This function reduces boilerplate when using `acquire` and `release`. It returns a promise that resolves when `fn` completes. It is functionally equivalent to:

```ts
try {
  await semaphore.acquire([options]);
  return await fn();
} finally {
  semaphore.release([key]);
}
```

### `requestIfAvailable` method

```ts
const results = await semaphore.requestIfAvailable(fn [, options]);
```

This is functionally equivalent to:

```ts
return semaphore.canAcquire([key])
  ? await semaphore.request(fn, [options])
  : null;
```

This is useful in scenarios where only one instance of a function block should run while discarding additional attempts. For example, handling repeated button clicks.

## Example 1

```ts
import { Semaphore } from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore();

// Using promises
semaphore
  .acquire()
  .then(() => {
    // This block executes once a lock is acquired.
    // If already locked, it waits and executes after all preceding locks are released.
    //
    // Critical operations
  })
  .finally(() => {
    // The lock is released, allowing the next queued block to proceed.
    semaphore.release();
  });

// Using async/await
try {
  await semaphore.acquire();

  // Critical operations
} finally {
  semaphore.release();
}

// Using the request function
await semaphore.request(() => {
  // Critical operations
});
```

## Example 2

Consider an asynchronous function that downloads a file and saves it to disk:

```ts
const downloadAndSave = async (url) => {
  const filePath = urlToFilePath(url);

  if (await pathExists(filePath)) {
    // The file is already on disk, so no action is required.
    return filePath;
  }

  await downloadAndSaveToFilepath(url, filePath);
  return filePath;
};
```

This approach works as expected until `downloadAndSave()` is called multiple times in quick succession with the same `url`. Without control, it could initiate simultaneous downloads that attempt to write to the same file at the same time.

This issue can be resolved by using a `Semaphore` with the `key` parameter:

```ts
import { Semaphore } from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore();

const downloadAndSave = async (url) => {
  try {
    await semaphore.acquire(url);

    // This block continues once a lock on url is acquired. This
    // permits multiple simultaneous downloads for different urls.

    const filePath = urlToFilePath(url);

    if (await pathExists(filePath)) {
      // the file is on disk, so no action is required
    } else {
      await downloadAndSaveToFilepath(url, filePath);
    }

    return filePath;
  } finally {
    semaphore.release(url);
  }
};
```

The same outcome can be achieved by using the `request` function:

```ts
const downloadAndSave = (url) => {
  return semaphore.request(async () => {
    const filePath = urlToFilePath(url);

    if (await pathExists(filePath)) {
      // The file is already on disk, so no action is required.
    } else {
      await downloadAndSaveToFilepath(url, filePath);
    }
    return filePath;
  }, url);
};
```

## API - GroupSemaphore

The `GroupSemaphore` class manages a semaphore for different _groups_ of tasks. A group is identified by a key, and the semaphore ensures that only one group can run its tasks at a time. The tasks within a group can run concurrently.

The `GroupSemaphore` class exposes `acquire` and `release` methods, which have the same interface as `Semaphore`. The only difference is that the `key` parameter is required.

### Example

```ts
import { GroupSemaphore } from "@chriscdn/promise-semaphore";

const groupSemaphore = new GroupSemaphore();

const RunA = async () => {
  try {
    await groupSemaphore.acquire("GroupA");

    // Perform asynchronous operations for group A
  } finally {
    groupSemaphore.release("GroupA");
  }
};

const RunB = async () => {
  try {
    await groupSemaphore.acquire("GroupB");

    // Perform asynchronous operations for group B
  } finally {
    groupSemaphore.release("GroupB");
  }
};
```

This setup allows `RunA` to be called multiple times, and will run concurrently. However, calling `RunB` will wait until all `GroupA` tasks are completed before acquiring the lock for `GroupB`. As soon as `GroupB` acquires the lock, any subsequent calls to `RunA` will wait until `GroupB` releases the lock before it executes.

## License

[MIT](LICENSE)
