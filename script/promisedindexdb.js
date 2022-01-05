'use strict'

class UnifiedPIDBRequestObject {
	static REQUEST_TYPE = Object.freeze({
		add: Symbol('add'),
		remove: Symbol('remove'),
		get: Symbol('get'),
		getAll: Symbol('getAll'),
		replace: Symbol('replace'),
	});

	static REQUEST_TYPE_ARR = Array.from(Object.values(UnifiedPIDBRequestObject.REQUEST_TYPE));

	constructor({requestType, objStoreName, transaction, object, id} = {}) {
		let u = UnifiedPIDBRequestObject;
		if ((!requestType || !objStoreName || (object && typeof object !== 'object'))
			|| (!u.REQUEST_TYPE_ARR.includes(requestType))
			|| (typeof objStoreName === 'string' && objStoreName.lentgth < 1)
			|| ([u.REQUEST_TYPE.remove, u.REQUEST_TYPE.replace].includes(requestType) && !id && !object)
			|| (transaction && !transaction instanceof IDBTransaction)
		)
			throw new Error(`Invalid arguments |${arguments}|`);

		this.requestType = requestType;
		this.objStoreName = objStoreName;
		this.transaction = transaction;
		this.id = id;
		this.object = object;
	}

}

class PromisedIndexDB {
	// Private Properties /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

	#openRequest = null;
	#dbName = null;
	#dbVersion = null;
	#currentDB = null;
	#openDBPromise = null;

	#versionChangeCallback = function () {
		console.log(`DB ${this.#currentDB.name} ver:${this.#currentDB.version} is closed due to VersionChange event`);
		if (this.#currentDB) this.#currentDB.close();
	}

	#upgradeNeededCallback = function (event) {
		let db = event.target.result;
		switch (db.version) {
			case 2:
				db.createObjectStore("someObjStore", {keyPath: 'id'});
			case 1:
				let objectStore = db.createObjectStore("testObjStore", {keyPath: 'id'});
				objectStore.createIndex("testIndex", "gender", {unique: false});

		}
	}

	#generalErrorHandler = function (event) {
		//todo handle non-abort query errors
		console.log(`Error in ${event.target}: ${event.target.error}`);
		throw new Error(`Error in ${event.target}: ${event.target.error}`);
	}

	constructor({dbName = 'dbTest', version = 1, upgradeNeededCallback = null, versionChangeCallback = null,} = {}) {
		if (!dbName || dbName.length < 1) return null;
		if (version < 1) return null;
		if (upgradeNeededCallback) this.#upgradeNeededCallback = upgradeNeededCallback;
		if (versionChangeCallback) this.#versionChangeCallback = versionChangeCallback;
		this.#dbVersion = version;
		this.#dbName = dbName;
	}

	#getDB() {
		if (this.#currentDB) return Promise.resolve(this.#currentDB);
		if (this.#openDBPromise && !this.#currentDB) return this.#openDBPromise;
		return this.#openDBPromise = new Promise((resolve, reject) => {
			console.log('opening getDB'); //todo delete this
			this.#openRequest = indexedDB.open(this.#dbName, this.#dbVersion);

			this.#openRequest.onupgradeneeded = this.#upgradeNeededCallback;

			this.#openRequest.onerror = this.#generalErrorHandler;

			this.#openRequest.onsuccess = (function (event) {
				this.#currentDB = event.target.result;
				this.#currentDB.onversionchange = this.#versionChangeCallback;
				this.#currentDB.onerror = this.#generalErrorHandler;
				resolve(this.#currentDB);
			}).bind(this);

			this.#openRequest.onblocked = function () {
				reject(new Error('DB is currently blocked'));
			};

		});
	}

	#arrayfication(objectForArrayfiaction) {
		if ((!objectForArrayfiaction)
			|| (!['object', 'string'].includes(typeof objectForArrayfiaction) && !Array.isArray(objectForArrayfiaction))
			|| (Array.isArray(objectForArrayfiaction) && objectForArrayfiaction.length < 1)
			|| (typeof objectForArrayfiaction === 'string' && objectForArrayfiaction.length < 1))
			throw new Error(`Invalid arguments |${objectForArrayfiaction}|`);

		return (Array.isArray(objectForArrayfiaction) ? objectForArrayfiaction : [objectForArrayfiaction]);
	}

	async #getTransaction({storeNamesArr = null, writeable = false} = {}) {
		if (!Array.isArray(storeNamesArr) || storeNamesArr.length < 1 || typeof (writeable) !== 'boolean')
			throw new Error(`Invalid arguments in |${getCallerFunctionName()}|`);

		if (!this.#currentDB) await this.#getDB();

		console.log('transaction opening'); //todo delete this
		let transaction = this.#currentDB.transaction(storeNamesArr, (writeable) ? 'readwrite' : 'readonly');

		transaction.oncomplete = (event) => {
			console.log('transaction closed');  //todo delete this
		};
		transaction.onerror = (event) => {
			console.log('transaction closed on error'); //todo delete this
		}

		return Promise.resolve(transaction);
	}

	// Public Methods /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
	//todo all methods must return null or result

	async addItem({objStoreName, object, replaceExisting = false, transaction} = {}) {
		if (!transaction) {
			if (!this.#currentDB) await this.#getDB();
			transaction = await this.#getTransaction({
				storeNamesArr: this.#arrayfication(objStoreName),
				writeable: true,
			});
		}
		let store = transaction.objectStore(objStoreName);
		let request = (replaceExisting) ? store.put(object) : store.add(object);
		return new Promise(((resolve, reject) => {
			request.onsuccess = () => {
				if (!transaction) request.transaction.commit();
				resolve(null);
			}
			request.onerror = () => {
				request.transaction.abort();
				reject();
			}
		}));
	}

	async removeItem({objStoreName, id, object, transaction} = {}) {
		if (!objStoreName || (!id && !object))
			throw new Error(`Invalid arguments |${arguments}|`);

		if (!transaction) {
			if (!this.#currentDB) await this.#getDB();
			transaction = await this.#getTransaction({
				storeNamesArr: this.#arrayfication(objStoreName),
				writeable: true,
			});
		}
		let objStore = transaction.objectStore(objStoreName);
		let request = objStore.delete(id ?? object[objStore.keyPath]);
		request.onsuccess = (resolve, reject) => {
			if (!transaction) request.transaction.commit();
			resolve(null);
		};
		request.onerror = (resolve, reject) => {
			request.transaction.abort();
			reject();
		};
	}

	// todo allow using callback functions on uobjArr
	// todo allow half-way functions call between transaction elements
	async allInOneTransaction(uObjArr) {
		if (!uObjArr || !Array.isArray(uObjArr) || uObjArr.length < 1)
			throw new Error(`Invalid arguments |${uObjArr}|`);

		let objStoreNamesSet = new Set();
		let writeable = false;

		for (let uniObj of uObjArr) {
			objStoreNamesSet.add(uniObj.objStoreName);
			if (!writeable && (uniObj.requestType === UnifiedPIDBRequestObject.REQUEST_TYPE.add
				|| uniObj.requestType === UnifiedPIDBRequestObject.REQUEST_TYPE.replace
				|| uniObj.requestType === UnifiedPIDBRequestObject.REQUEST_TYPE.remove))
				writeable = true;
		}

		let trans = await this.#getTransaction({
			storeNamesArr: Array.from(objStoreNamesSet),
			writeable: writeable,
		});

		for (let uniObj of uObjArr) {
			uniObj.transaction = trans;
			switch (uniObj.requestType) {
				case UnifiedPIDBRequestObject.REQUEST_TYPE.add:
					uniObj.result = await this.addItem(uniObj);
					break;
				case UnifiedPIDBRequestObject.REQUEST_TYPE.replace:
					uniObj.replaceExisting = true;
					uniObj.result = await this.addItem(uniObj);
					break;
				case UnifiedPIDBRequestObject.REQUEST_TYPE.remove:
					uniObj.result = await this.removeItem(uniObj);
					break;
				case UnifiedPIDBRequestObject.REQUEST_TYPE.getAll:
					uniObj.result = await this.getAllItems(uniObj);
					break;
			}
		}
		trans.commit();
	}

	async getAllItems({objStoreName, transaction} = {}) {
		let objStore = (transaction ?? await this.#getTransaction({
			storeNamesArr: this.#arrayfication(objStoreName),
			writeable: false
		})).objectStore(objStoreName);
		let request = objStore.getAll();
		return new Promise(((resolve, reject) => {
				request.onerror = () => {
					request.transaction.abort();
					reject();
				}

				request.onsuccess = () => {
					if (!transaction) request.transaction.commit();
					resolve(request.result);
				}

			})
		);
	}

	async countAll({objStoreName, transaction} = {}) {
		let objStore = (transaction ?? await this.#getTransaction({
			storeNamesArr: this.#arrayfication(objStoreName),
			writeable: false
		})).objectStore(objStoreName);
		let request = objStore.count();
		return new Promise(((resolve, reject) => {

			request.onerror = () => {
				request.transaction.abort();
				reject();
			}

			request.onsuccess = () => {
				if (!transaction) request.transaction.commit();
				resolve(isNaN(request.result) ? 0 : request.result);
			}

		}));
	}

	async hasItem({objStoreName, transaction, id, object, comparingPropPath} = {}) {
		if (!objStoreName || (!id && !object))
			throw new Error(`Invalid arguments |${arguments}|`);

		let item = await this.getItem(arguments[0]);
		if (!item) return Promise.resolve(false);

		if (!comparingPropPath) return Promise.resolve(true);

		let propToCompareArr = getPropValueArrFromEnum([item, object], comparingPropPath);
		return Promise.resolve(propToCompareArr?.length === 2 && objectComparator(...propToCompareArr));
	}

	async getItem({objStoreName, id, object, transaction} = {}) {
		if (!objStoreName || (!id && !object))
			throw new Error(`Invalid arguments |${arguments}|`);

		if (!transaction) {
			if (!this.#currentDB) await this.#getDB();
			transaction = await this.#getTransaction({
				storeNamesArr: this.#arrayfication(objStoreName),
				writeable: true,
			});
		}
		let objStore = transaction.objectStore(objStoreName);
		let request = objStore.get(id ?? object[objStore.keyPath]);
		return new Promise(((resolve, reject) => {
				request.onerror = () => {
					request.transaction.abort();
					reject();
				}

				request.onsuccess = () => {
					if (!transaction) request.transaction.commit();
					resolve(request.result);
				}

			})
		);
	}

	async getDBObjectStores() {
		return Promise.resolve(Array.from(((this.#currentDB) ?? (await this.#getDB())).objectStoreNames));
	}

	deleteDB() {
		if (this.#currentDB) this.#currentDB.close();
		indexedDB.deleteDatabase(this.#dbName);
	}
}

// Global variable -------------------------------------------------------------------------------------------------
let pidb = new PromisedIndexDB({
	dbName: 'dbGalleries',
	version: 1,
	upgradeNeededCallback: function (event) {
		let db = event.target.result;
		switch (db.version) {
			case 1:
				db.createObjectStore('images', {keyPath: 'url'});
				db.createObjectStore('galleries', {keyPath: 'name'});
		}
	}
}); // IDB manager class instance


// Executable function -------------------------------------------------------------------------------------------------
