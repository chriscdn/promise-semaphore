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

## API

### Create an instance

```js
const Semaphore = require('@chriscdn/promise-semaphore')
const semaphore = new Semaphore([maxConcurrent])
```

The `maxConcurrent` parameter is optional, and defaults to `1` (making it an exclusive lock or *binary semaphore*).  Use an integer value greater than one to limit how many times the code block can be simultaneously executing from separate iterations of the event loop.

### Acquire a lock

```js
semaphore.acquire([key])
```

This returns a `Promise`, which resolves once a lock has been acquired.  The `key` parameter is optional and permits the same `Semaphore` instance to be used in different contexts.  See the second example.

### Release a lock

```js
semaphore.release([key])
```

The `release` call should be executed from a `finally` block (whether using promises or a try/catch block) to guarantee it gets called.

## Example 1

```js
const Semaphore = require('@chriscdn/promise-semaphore')
const semaphore = new Semaphore()

// using promises
semaphore.acquire()
	.then(() => {
		// This block executes once a lock has been acquired.  If already locked
		// then this block will wait and execute once all locks preceeding it have been
		// released.
	})
	.finally(() => {
		// release the lock permitting the next queued process to continue
		semaphore.release()
	})

// or, using async/await
await semaphore.acquire()

try {
	// do your stuff here
} finally {
	semaphore.release()
}
```

## Example 2

Say you have an asynchronous function to download a file and cache it to disk:

```js
async function downloadAndCache(url) {

	// cacheFileName could be based on a hash of the url
	const cacheFileName = getCacheFileName(url)

	if (!fs.existsSync(cacheFileName)) {
		await downloadToFile(url, cacheFileName)
	}

	return cacheFileName
}
```

This works until a process calls `downloadAndCache()` in short succession with the same `url` parameter. This can cause multiple simultaneous downloads that attempt to write to the same cached file.

This can be resolved with a `Semaphore` instance using the `key` parameter:

```js
const Semaphore = require('@chriscdn/promise-semaphore')
const semaphore = new Semaphore()

async function downloadAndCache(url) {

	await semaphore.acquire(url)

	// This block continues once a lock on url is acquired.  This permits
	// multiple simulataneous downloads for unique url values.

	try {
		const cacheFileName = getCacheFileName(url)

		if (!await pathExists(cacheFileName)) {
			await downloadToFile(url, cacheFileName)	
		}

		return cacheFileName

	} finally {
		semaphore.release(url)
	}
}
```

## License

[MIT](LICENSE)