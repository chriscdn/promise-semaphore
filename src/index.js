class LockItem {
	constructor() {
		this.queue = []
		this.isLocked = false
	}

	acquire() {
		if (this.isLocked) {
			return new Promise(resolve => {
				this.queue.push(resolve)
			})

		} else {
			this.isLocked = true
			return Promise.resolve()
		}
	}

	release() {
		let resolveFunc = this.queue.shift()

		if (resolveFunc) {
			resolveFunc()
		} else {
			this.isLocked = false
		}
	}
}

class Lock {
	constructor() {
		this.lockItems = {}
	}

	getLockItem(key) {
		if (!this.lockItems[key]) {
			this.lockItems[key] = new LockItem()
		}
		return this.lockItems[key]
	}

	_tidy(key) {
		if (this.lockItems[key].length == 0) {
			delete this.lockItems[key]
		}
	}

	acquire(key) {
		return this.getLockItem(key).acquire()
	}

	release(key) {
		this.getLockItem(key).release()
		this._tidy(key)
	}

	isLocked(key) {
		const isLocked = this.getLockItem(key).isLocked
		this._tidy(key)
		return isLocked
	}

}

module.exports = Lock