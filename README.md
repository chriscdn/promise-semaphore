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

This returns a `Promise`, which resolves once a lock has been acquired.  The `key` parameter is optional and permits the same `Semaphore` instance to be used in different contexts.

### Release a lock

```js
semaphore.release([key])
```

## Example

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

## License

[MIT](LICENSE)