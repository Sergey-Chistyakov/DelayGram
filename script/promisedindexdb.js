/*
1. id = gallery + url
3. generalErrorHandler - for non-abort query errors

 */
'use strict'

class PromisedIndexDB {
    #openRequest = null;
    #dbName = null;
    #dbVersion = null;
    #currentDB = null;
    #occupied = false;
    #requestArr = [];
    #storeNamesArr = new Set();
    #writeable = false;
    #queryErrorAbortCurrent = true;
    #transaction = null;

    // get currentDB() {
    //     return this.#currentDB;
    // }
    //
    // set currentDB(value) {
    //     this.#currentDB = value;
    // }


    #versionChangeCallback = function () {
        console.log(`DB ${this.#currentDB.name} ver:${this.#currentDB.version} is closed due to VersionChange event`);
        if (this.#currentDB) this.#currentDB.close();
    }

    #upgradeNeededCallback = function (event) {
        let db = event.target.result;
        switch (db.version) {
            case 1:
                let objectStore = db.createObjectStore("testObjStore", {keyPath: 'id'});
                objectStore.createIndex("testIndex", "group", {unique: false});
        }
    }

    //handle non-abort query errors
    #generalErrorHandler = function (event) {
        throw new Error(`Error in ${event.target}: ${event.target.error}`);
    }

    constructor({dbName = null, version = 1, upgradeNeededCallback = null, versionChangeCallback = null,} = {}) {
        if (!dbName || dbName.length < 1) return null;
        if (version < 1) return null;
        if (upgradeNeededCallback) this.#upgradeNeededCallback = upgradeNeededCallback;
        if (versionChangeCallback) this.#versionChangeCallback = versionChangeCallback;
        this.#dbVersion = version;
        this.#dbName = dbName;
    }

    #getDB() {
        console.log('in getDB'); //todo delete this
        if (this.#currentDB) return Promise.resolve(this.#currentDB);
        return new Promise((resolve, reject) => {
            this.#openRequest = indexedDB.open(this.#dbName, this.#dbVersion);

            this.#openRequest.onupgradeneeded = this.#upgradeNeededCallback;

            this.#openRequest.onerror = this.#generalErrorHandler;

            this.#openRequest.onsuccess = (function (event) {
                this.#currentDB = event.target.result;
                this.#currentDB.onversionchange = this.#versionChangeCallback;
                resolve(this.#currentDB);
            }).bind(this);

            this.#openRequest.onblocked = function () {
                reject(new Error('DB is currently blocked'));
            };

        });
    }

    #getTransaction() {
        if (this.#transaction && 'closed' in this.#transaction && !this.#transaction.closed) {
            console.log('existing transaction passed');
            return this.#transaction;
        }
        console.log('transaction opening');
        let transaction = this.#currentDB.transaction(Array.from(this.#storeNamesArr), (this.#writeable) ? 'readwrite' : 'readonly');
        transaction.closed = false;

        transaction.oncomplete = function (event) {
            console.log('transaction closed');
            transaction.closed = true;
        };
        transaction.onerror = (event) => {
            transaction.closed = true;
            // console.log(event.target.error);
        }
        return this.#transaction = transaction;
    }


    addRequest({storeName = null, writeable = null, query = null,} = {}) {
        if (!storeName || !query) throw new Error('Store name or query is empty');
        // if (!(await this.#getDB().objectStoreNames.includes(storeName))) throw new Error('Such store name not exist in DB');
        this.#requestArr.push(query);
        this.#storeNamesArr.add(storeName);
        if (!this.#writeable && writeable) this.#writeable = !!writeable;

        return this;
    }

    async commit() {
        let resultPromisesArr = [];

        await this.#getDB();

        for (let request of this.#requestArr) {
            resultPromisesArr.push(new Promise((resolve) => {
                request.onsuccess = () => {
                    if (request.result) resolve(request.result);
                    resolve();
                };
            }));
            request(this.#getTransaction());
        }
        return resultPromisesArr;
    }
}

// Executable function-------------------------------------------------------------------------------------------------
(async () => {
    let request =
        new PromisedIndexDB({dbName: 'dbTest', version: 1,})
            .addRequest({
                storeName: 'testObjStore', writeable: true, query: function (tr) {
                    tr.objectStore('testObjStore').add({id: '1', group: 'male', name: 'John'});
                    tr.objectStore('testObjStore').add({id: '2', group: 'female', name: 'Lana'});
                    tr.objectStore('testObjStore').add({id: '3', group: 'female', name: 'Anna'});
                    tr.objectStore('testObjStore').add({id: '4', group: 'male', name: 'Pete'});
                }
            })
            .addRequest({
                storeName: 'testObjStore', writeable: false, query: function (tr) {
                    tr.objectStore('testObjStore').getAll();
                }
            })
            .commit();

    let result = await Promise.all(await request);
    // (() => {    })(); //todo delete this
    result.forEach(requestResult => {
        if (requestResult) {
            requestResult.forEach((element) => {
                console.log(`name: ${element.name}, group: ${element.group}`);
            });
        }
    });
})();
