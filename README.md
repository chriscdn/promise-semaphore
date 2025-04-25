# @chriscdn/promise-semaphore

Limit or throttle the simultaneous execution of asynchronous code in separate iterations of the event loop.

## Installing

Using npm:

```bash
npm install @chriscdn/promise-semaphore
```

Using yarn:

```bash
yarn add @chriscdn/promise-semaphore
```

## API

### Create an instance

```js
import Semaphore from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore([maxConcurrent]);
```

The `maxConcurrent` parameter is optional and defaults to `1` (making it an exclusive lock or _binary semaphore_). An integer greater than `1` can be used to allow multiple concurrent executions from separate iterations of the event loop.

### Acquire a lock

```js
semaphore.acquire([key]);
```

This returns a `Promise` that resolves once a lock is acquired. The `key` parameter is optional and allows the same `Semaphore` instance to manage locks in different contexts. Additional details are provided in the second example.

### Release a lock

```js
semaphore.release([key]);
```

The `release` method should be called within a `finally` block (whether using promises or a `try/catch` block) to ensure the lock is released.

### Check if a lock can be acquired

```js
semaphore.canAcquire([key]);
```

This synchronous method returns `true` if a lock can be immediately acquired, and `false` otherwise.

### `count`

```js
semaphore.count([key]);
```

This synchronous function returns the current number of locks.

### `wait` method

```js
semaphore.wait([key]);
```

This asynchronous function resolves immediately if `count` is 0; otherwise, it resolves once `count` reaches 0.

### `request` method

```js
const results = await semaphore.request(fn [, key]);
```

This function reduces boilerplate when using `acquire` and `release`. It returns a promise that resolves when `fn` completes. It is functionally equivalent to:

```js
try {
  await semaphore.acquire([key]);
  const results = await fn();
} finally {
  semaphore.release([key]);
}
```

### `requestIfAvailable` method

```js
const results = await semaphore.requestIfAvailable(fn [, key]);
```

This is functionally equivalent to:

```js
const results = semaphore.canAcquire([key])
  ? await semaphore.request(fn, [key])
  : null;
```

This is useful in scenarios where only one instance of a function block should run while discarding additional attempts. For example, handling repeated button clicks.

## Example 1

```js
import Semaphore from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore();

// Using promises
semaphore
  .acquire()
  .then(() => {
    // This block executes once a lock is acquired.
    // If already locked, it waits and executes after all preceding locks are released.
    //
    // Critical operations are performed here.
  })
  .finally(() => {
    // The lock is released, allowing the next queued block to proceed.
    semaphore.release();
  });

// Using async/await
try {
  await semaphore.acquire();

  // Critical operations are performed here.
} finally {
  semaphore.release();
}

// Using the request function
await semaphore.request(() => {
  // Critical operations are performed here.
});
```

## Example 2

Consider an asynchronous function that downloads a file and saves it to disk:

```js
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

This approach works as expected until `downloadAndSave()` is called multiple times with the same `url` in quick succession. Without control, it could initiate simultaneous downloads that attempt to write to the same file at the same time.

This issue can be resolved by using a `Semaphore` with the `key` parameter:

```js
import Semaphore from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore();

const downloadAndSave = async (url) => {
  try {
    await semaphore.acquire(url);

    // This block continues once a lock on url is acquired. This
    // permits multiple simulataneous downloads for different urls.

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

The same outcome can be achieved using the `request` function:

```js
const downloadAndSave = (url) => {
  return semaphore.request(async () => {
    const filePath = urlToFilePath(url);

    if (await pathExists(filePath)) {
      // The file is already on disk, so no action is required.
      return filePath;
    }

    await downloadAndSaveToFilepath(url, filePath);

    return filePath;
  }, url);
};
```

## License

[MIT](LICENSE)
