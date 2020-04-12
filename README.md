# @chriscdn/promise-lock

Lock asynchronous code to prevent it from being run at the same time from different iterations of the event loop.

## Installing

Using npm:

``` bash
$ npm install @chriscdn/promise-lock
```

Using yarn:

``` bash
$ yarn add @chriscdn/promise-lock
```

## API

### Create an instance

``` js
const Lock = require('@chriscdn/promise-lock')
const lock = new Lock()
```

### Acquire a lock

``` js
lock.acquire([key])
```

This returns a `Promise`, which resolves once the lock has been acquired.  The `key` parameter is optional and permits the same `Lock` instance to be used in different contexts.

### Release a lock

``` js
lock.release([key])
```

## Example

``` js
const Lock = require('@chriscdn/promise-lock')
const lock = new Lock()

// using promises
lock.acquire()
	.then(() => {
		// This block executes once the lock has been acquired.  If already locked
		// then this block will wait and execute once all locks preceeding it have been
		// released.
	})
	.finally(() => {
		// release the lock on completion
		lock.release()
	})

// or, using async/await
await lock.acquire()

try {
	// do your stuff here
} finally {
	lock.release()
}
```

## License

[MIT](LICENSE)