'use strict';

class SemaphoreItem {
	constructor(max = 1) {
		this.queue = [];
		this.max = max;
		this.semaphoreCount = 0;
	}

	acquire() {
		if (this.semaphoreCount < this.max) {
			this.semaphoreCount++;
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
			// Should we setTimeout() this call to defer it to the next event loop iteration?
			resolveFunc();
		} else {
			this.semaphoreCount--;
		}
	}
}

const defaultKey = '_default';

class Semaphore {
	constructor(max = 1) {
		this.semaphoreItems = {};
		this.max = max;
	}

	getSemaphoreInstance(key = defaultKey) {
		if (!this.semaphoreItems[key]) {
			this.semaphoreItems[key] = new SemaphoreItem(this.max);
		}
		return this.semaphoreItems[key]
	}

	_tidy(key = defaultKey) {
		if (this.semaphoreItems[key].length == 0) {
			delete this.semaphoreItems[key];
		}
	}

	acquire(key = defaultKey) {
		return this.getSemaphoreInstance(key).acquire()
	}

	release(key = defaultKey) {
		this.getSemaphoreInstance(key).release();
		this._tidy(key);
	}

	isSemaphoreed(key = defaultKey) {
		const isSemaphoreed = this.getSemaphoreInstance(key).isSemaphoreed;
		this._tidy(key);
		return isSemaphoreed
	}
}

module.exports = Semaphore;
