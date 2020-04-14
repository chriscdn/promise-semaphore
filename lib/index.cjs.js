'use strict';

class SemaphoreItem {
	constructor(max) {
		this.queue = [];
		this.max = max;
		this.count = 0;
	}

	acquire() {
		if (this.count < this.max) {
			this.count++;
			return Promise.resolve()
		} else {
			return new Promise(resolve => {
				this.queue.push(resolve);
			})
		}
	}

	release() {
		let resolveFunc = this.queue.shift();

		if (resolveFunc) {
			// Give the micro task queue a small break
			// resolveFunc()
			setTimeout(resolveFunc, 0);
		} else {
			this.count--;
		}
	}
}

const defaultKey = '_default';

class Semaphore {
	constructor(max = 1) {
		this.semaphoreItems = {};
		this.max = max;
	}

	_getSemaphoreInstance(key = defaultKey) {
		if (!this.semaphoreItems[key]) {
			this.semaphoreItems[key] = new SemaphoreItem(this.max);
		}
		return this.semaphoreItems[key]
	}

	_tidy(key = defaultKey) {
		if (this.semaphoreItems[key].count == 0) {
			delete this.semaphoreItems[key];
			// console.log(`cleaning up: ${key}`)
		}
	}

	acquire(key = defaultKey) {
		return this._getSemaphoreInstance(key).acquire()
	}

	release(key = defaultKey) {
		this._getSemaphoreInstance(key).release();
		this._tidy(key);
	}
}

module.exports = Semaphore;
