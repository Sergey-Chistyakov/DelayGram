/*
1. id = gallery + url
3. generalErrorHandler - for non-abort query errors

 */
'use strict'

class PromisedIndexDB {
    // Static Methods /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/


    // Private Properties /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

    #openRequest = null;
    #dbName = null;
    #dbVersion = null;
    #currentDB = null;
    #transaction = null; // todo turn into ExtendedMap

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

        if (this.#transaction
            && 'closed' in this.#transaction
            && !this.#transaction.closed
            && (this.#transaction.mode == (writeable) ? 'readwrite' : 'readonly')
            && storeNamesArr?.reduce((accumulator, currentValue) => {
                if (accumulator === false) return false;
                return this.#transaction.objectStoreNames.contains(currentValue);
            }, true)) {
            console.log('existing transaction passed'); //todo delete this
            return this.#transaction;
        }

        console.log('transaction opening');
        let transaction = this.#currentDB.transaction(storeNamesArr, (writeable) ? 'readwrite' : 'readonly');
        transaction.closed = false;

        transaction.oncomplete = (event) => {
            console.log('transaction closed');
            transaction.closed = true;
        };
        transaction.onerror = (event) => {
            console.log('transaction closed on error');
            transaction.closed = true;
        }
        return this.#transaction = transaction;
    }

    async #getObjectStore(objStoreName, writeable = false, transaction) {
        if (!(await this.getDBObjectStores()).includes(objStoreName))
            throw new Error(`ObjectSore |${objStoreName}|  not found in DB |${getCallerFunctionName()}|`);
        await this.#getDB();
        if (!transaction)
            transaction = await this.#getTransaction({
                storeNamesArr: [objStoreName],
                writeable: writeable,
            });
        return transaction.objectStore(objStoreName);
    }

    // Public Methods /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

    //todo commit transaction
    //todo use #getObjStore
    //todo adding in multiple objstores via one transaction needed
    async add(objStore, objToAddArr, replaceExisting = false) {
        switch (true) {
            case (!objStore || !objToAddArr):
            case (typeof objToAddArr !== 'object' && !Array.isArray(objToAddArr)):
            case (Array.isArray(objToAddArr) && objToAddArr.length < 1):
                throw new Error(`Invalid arguments in |${getCallerFunctionName()}|`);
        }

        await this.#getDB();
        for (let element of (Array.isArray(objToAddArr) ? objToAddArr : [objToAddArr])) {
            let storeInTrans = (await this.#getTransaction({
                storeNamesArr: [objStore],
                writeable: true,
            })).objectStore(objStore);

            // this.#getObjectStore(objStore)
            if (!replaceExisting) storeInTrans.add(element);
            else storeInTrans.put(element);
        }
        return this;
    }

    removeAllItemsByIndex() {

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

    getAllItemsByIndex() {

    }

    getAllItems() {

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
    await pidb.add('testObjStore', [
        {id: 1, name: 'Jordan', gender: 'male',},
        {id: 2, name: 'Damien', gender: 'male',},
        {id: 3, name: 'Johanne', gender: 'female',}]);
    await pidb.add('testObjStore', {id: 4, name: 'Katerina', gender: 'female',});
    await pidb.add('testObjStore', {id: 4, name: 'Kate Replaced', gender: 'female',}, true);
    await pidb.add('someObjStore', [{id: 5, name: 'Helen', gender: 'female',}]);
    await pidb.clearObjStore('someObjStore');
    await pidb.removeItem('testObjStore', 2);
})();