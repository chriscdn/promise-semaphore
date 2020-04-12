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

const defaultKey = '_default'

class Lock {
	constructor() {
		this.lockItems = {}
	}

	getLockItem(key = defaultKey) {
		if (!this.lockItems[key]) {
			this.lockItems[key] = new LockItem()
		}
		return this.lockItems[key]
	}

	_tidy(key = defaultKey) {
		if (this.lockItems[key].length == 0) {
			delete this.lockItems[key]
		}
	}

	acquire(key = defaultKey) {
		return this.getLockItem(key).acquire()
	}

	release(key = defaultKey) {
		this.getLockItem(key).release()
		this._tidy(key)
	}

	isLocked(key = defaultKey) {
		const isLocked = this.getLockItem(key).isLocked
		this._tidy(key)
		return isLocked
	}
}

module.exports = Lock