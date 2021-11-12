'use strict'

class UnifiedPIDBRequestObject {
    constructor(requestType, objStoreName, transaction, object, id) {
        switch (true) {
            case (!requestType || !objStoreName || !object):
            case (!Array.isArray(object) && typeof object !== 'object'):
            case (typeof objStoreName === 'string' && objStoreName.lentgth < 1):
            case (!Array.from(Object.values(this.#REQUEST_TYPE)).includes(requestType)):
            case (transaction && transaction instanceof IDBTransaction):
                throw new Error(`Invalid arguments in |${getCallerFunctionName()}|`);
        }

        this.requestType = requestType;
        this.objStoreName = objStoreName;
        this.transaction = transaction;
        this.id = id;
        this.object = object;
    }

    #REQUEST_TYPE = {
        add: 'add',
        remove: 'remove',
        get: 'get',
        getAll: 'getAll',
        replace: 'replace',
    };

    get REQUEST_TYPE() {
        return this.#REQUEST_TYPE;
    }
}

class PromisedIndexDB {
    // Static Methods and public Properties /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/


    // Private Properties /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

    #openRequest = null;
    #dbName = null;
    #dbVersion = null;
    #currentDB = null;

    //todo incorrect private property accession: error occurs via dual db opening
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

    //handle non-abort query errors
    #generalErrorHandler = function (event) {
        console.log(`Error in ${event.target}: ${event.target.error}`);
        //throw new Error(`Error in ${event.target}: ${event.target.error}`);
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
        return new Promise((resolve, reject) => {
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

    #getTransaction({storeNamesArr = null, writeable = false} = {}) {
        if (!Array.isArray(storeNamesArr) || storeNamesArr.length < 1 || typeof (writeable) !== 'boolean')
            throw new Error(`Invalid arguments in |${getCallerFunctionName()}|`);

        console.log('transaction opening');
        let transaction = this.#currentDB.transaction(storeNamesArr, (writeable) ? 'readwrite' : 'readonly');

        transaction.oncomplete = (event) => {
            console.log('transaction closed');
        };
        transaction.onerror = (event) => {
            console.log('transaction closed on error');
        }
        return transaction;
    }

    async #getObjectStore(objStoreName, writeable = false, transaction) {
        if (!(await this.getDBObjectStores()).includes(objStoreName))
            throw new Error(`ObjectSore |${objStoreName}|  not found in DB |${getCallerFunctionName()}|`);
        await this.#getDB();
        return (transaction) ? transaction.objectStore(objStoreName)
            : (await this.#getTransaction({
                storeNamesArr: [objStoreName],
                writeable: writeable,
            })).objectStore(objStoreName);
    }

    #arrayfication(objectForArrayfiaction) {
        switch (true) {
            case (!objectForArrayfiaction):
            case (!(typeof objectForArrayfiaction === 'object' || typeof objectForArrayfiaction === 'string') && !Array.isArray(objectForArrayfiaction)):
            case (Array.isArray(objectForArrayfiaction) && objectForArrayfiaction.length < 1):
            case (typeof objectForArrayfiaction === 'string' && objectForArrayfiaction.length < 1):
                throw new Error(`Invalid arguments in |${getCallerFunctionName()}|`);
        }
        return (Array.isArray(objectForArrayfiaction) ? objectForArrayfiaction : [objectForArrayfiaction]);
    }

    // Public Methods /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

    //todo return promise
    async add({objStore, objToAddArr, replaceExisting = false, transaction} = {}) {
        let emptyTransaction = !!transaction;
        let promiseArr = [];
        if (!transaction) {
            await this.#getDB();
            transaction = await this.#getTransaction({
                storeNamesArr: this.#arrayfication(objStore),
                writeable: true,
            });
        }
        let store = await this.#getObjectStore(objStore, undefined, transaction);
        for (let element of this.#arrayfication(objToAddArr)) {
            let request = (replaceExisting) ? store.put(element) : store.add(element);
            promiseArr.push(new Promise(((resolve, reject) => {
                request.onsuccess = () => {
                    if (emptyTransaction) request.transaction.commit();
                    resolve();
                }
                request.onerror = () => {
                    if (emptyTransaction) request.transaction.abort();
                    reject()
                }
            })));
        }
        return Promise.all(promiseArr);
    }

    // todo rewrite to delete several items via array
    // todo check if transaction commit works properly
    async removeItem(objStoreName, itemID) {
        if (!objStoreName || !itemID)
            throw new Error(`Invalid arguments in |${getCallerFunctionName()}|`);
        let request = (await this.#getObjectStore(objStoreName, true)).delete(itemID);
        request.onsuccess = () => request.transaction.commit();
        request.onerror = () => request.transaction.abort();
    }

    allInOneTransaction({} = {}) {

    }

    async getAllItems(objStoreName) {
        let objStore = await this.#getObjectStore(objStoreName);
        let request = objStore.getAll();
        return new Promise(((resolve, reject) => {
                request.onerror = () => {
                    console.log('failed');
                    reject();
                    request.transaction.abort();
                }

                request.onsuccess = () => {
                    request.transaction.commit();
                    resolve(request.result);
                }

            })
        );
    }

    async getDBObjectStores() {
        return Array.from((await this.#getDB()).objectStoreNames);
    }

    //todo return promise
    async clearObjStore(objStoreName) {
        let request = (await this.#getObjectStore(objStoreName, true)).clear();
        request.onsuccess = () => request.transaction.commit();
        request.onerror = () => request.transaction.abort();
    }

    deleteDB() {
        if (this.#currentDB) this.#currentDB.close();
        indexedDB.deleteDatabase(this.#dbName);
    }
}

// Executable function-------------------------------------------------------------------------------------------------
let pidb = new PromisedIndexDB({version: 2});
(async () => {
    pidb.deleteDB();
    let prom = Promise.all([pidb.add({
        objStore: 'someObjStore',
        objToAddArr: [{id: 1, name: 'John', gender: 'male',}],
    }),
        pidb.add({
            objStore: 'someObjStore',
            objToAddArr: [{id: 2, name: 'Mari', gender: 'female',}],
        }),
        pidb.add({
            objStore: 'someObjStore',
            objToAddArr: [{id: 3, name: 'Helen', gender: 'female',}],
        }),]);
    await prom;
    let res = await pidb.getAllItems('someObjStore');
    console.log(res.length);
    console.log(res[0]);
    await pidb.removeItem('someObjStore', 1);
    res = await pidb.getAllItems('someObjStore');
    console.log(res.length);
})();
