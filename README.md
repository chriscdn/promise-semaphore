# @chriscdn/promise-semaphore

Limit or throttle the simultaneous execution of asynchronous code in separate iterations of the event loop.

## Installing

Using npm:

```bash
$ npm install @chriscdn/promise-semaphore
```

Using yarn:

```bash
$ yarn add @chriscdn/promise-semaphore
```

## Updating v1 to v2

Version 2 adds TypeScript and better inline documentation. The API remains the same, and doesn't introduce any breaking changes.

## API

### Create an instance

```js
import Semaphore from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore([maxConcurrent]);
```

The `maxConcurrent` parameter is optional, and defaults to `1` (making it an exclusive lock or _binary semaphore_). Use an integer value greater than one to limit how many times the code block can be simultaneously executing from separate iterations of the event loop.

### Acquire a lock

```js
semaphore.acquire([key]);
```

This returns a `Promise`, which resolves once a lock has been acquired. The `key` parameter is optional and permits the same `Semaphore` instance to be used in different contexts. See the second example.

### Release a lock

```js
semaphore.release([key]);
```

The `release` call should be executed from a `finally` block (whether using promises or a try/catch block) to guarantee it gets called.

### Check if a lock can be acquired

```js
semaphore.canAcquire([key]);
```

This method is synchronous, and returns `true` if a lock can be immediately acquired, `false` otherwise.

### request function

```js
const results = await semaphore.request(fn [,key])
```

This function reduces boilerplate when using `acquire` and `release`. It returns a promise, which resolves once `fn` has completed. It is functionally equivalent to:

```js
try {
  await semaphore.acquire([key]);
  const results = await fn();
} finally {
  semaphore.release([key]);
}
```

See the examples below.

### requestIfAvailable function

```js
const results = await semaphore.requestIfAvailable(fn [,key])
```

This is functionally equivalent to:

```js
const results = semaphore.canAcquire([key] ?
	await semaphore.request(fn, [key]) :
	null
```

This is useful in situations when only one instance of a function block should run at a time, while discarding other attempts to execute the block. E.g., a button is repeatedly clicked.

## Example 1

```js
import Semaphore from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore();

// using promises
semaphore
  .acquire()
  .then(() => {
    // This block executes once a lock is acquired.  If already locked,
    // then wait and execute once all preceeding locks have been released.
    //
    // do your critical stuff here
  })
  .finally(() => {
    // release the lock permitting the next queued block to continue
    semaphore.release();
  });

// or, using async/await
try {
  await semaphore.acquire();

  // do your critical stuff here
} finally {
  semaphore.release();
}

// or, using the request function
semaphore.request(() => {
  // do your critical stuff here
});
```

## Example 2

Say you have an asynchronous function to download a file and save it to disk:

```js
async function downloadAndSave(url) {
  const filePath = urlToFilePath(url);

  if (await pathExists(filePath)) {
    // the file is on disk, so no action is required
  } else {
    await downloadAndSaveToFilepath(url, filePath);
  }

  return filePath;
}
```

This works until a process calls `downloadAndSave()` multiple times in short succession with the same `url`. This can cause multiple simultaneous downloads that attempt to write to the same file at the same time.

This can be resolved with a `Semaphore` instance using the `key` parameter:

```js
import Semaphore from "@chriscdn/promise-semaphore";
const semaphore = new Semaphore();

async function downloadAndSave(url) {
  try {
    await semaphore.acquire(url);

    // This block continues once a lock on url is acquired.  This
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
}
```

Alternatively, this can be accomplished with the `request` function:

```js
async function downloadAndSave(url) {

	return semaphore.request(() => {
		const filePath = urlToFilePath(url)

		if (await pathExists(filePath)) {
			// the file is on disk, so no action is required
		} else {
			await downloadAndSaveToFilepath(url, filePath)
		}

		return filePath
	}, url)

}
```

## License

[MIT](LICENSE)
