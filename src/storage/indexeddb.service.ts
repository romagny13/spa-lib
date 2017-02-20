import { isUndefined, isDefined, isString, isArray, isBoolean } from '../util';
import { getIndexedDB } from './util';

function handleFail(request, reject) {
    request.onerror = (e) => { reject(e); };
    request.onblocked = (e) => { reject(e); };
    request.onabort = (e) => { reject(e); };
}

export class IndexedDBService {
    _indexedDB: any;
    _currentDb: any;
    _currentDbName: string;
    _currentConfig: any;
    _dbConfigs: any[];

    constructor(dbConfigs?: any[]) {
        this._indexedDB = getIndexedDB();
        this._dbConfigs = isDefined(dbConfigs) && dbConfigs || [];
    }

    getDbConfig(dbName) {
        return this._dbConfigs.find((c) => c.name === dbName);
    }

    openCreateDb(dbName: string, dbVersion: number) {
        return new Promise((resolve, reject) => {
            let request = this._indexedDB.open(dbName, dbVersion);
            handleFail(request, reject);
            // upgrade
            request.onupgradeneeded = (e) => {
                let db = e.target.result;
                let dbConfig = this.getDbConfig(dbName);
                if (dbConfig && isArray(dbConfig.objectStores)) {
                    dbConfig.objectStores.forEach((objectStoreConfig) => {
                        if (!db.objectStoreNames.contains(objectStoreConfig.name)) {
                            this.createObjectStore(db, objectStoreConfig.name, objectStoreConfig.key, objectStoreConfig.indexes);
                        }
                    });
                }
            };
            request.onsuccess = (e) => {
                this._currentDb = e.target.result;
                this._currentDbName = dbName;
                this._currentConfig = this.getDbConfig(dbName);
                resolve(this._currentDb);
            };
        });
    }

    closeDb() {
        if (this._currentDb && 'close' in this._currentDb) { this._currentDb.close(); }
    }

    deleteDb(dbName) {
        return new Promise((resolve, reject) => {
            if (this._currentDbName === dbName) {
                this.closeDb();
            }
            let request = this._indexedDB.deleteDatabase(dbName);
            handleFail(request, reject);
            request.onsuccess = (e) => { resolve(e); };
        });
    }

    createObjectStore(db: any, objectStoreName: string, key: any, indexes?: any[]) {
        let objectStore = db.createObjectStore(objectStoreName, key);
        if (indexes) {
            indexes.forEach((index) => {
                let options = index.definition || { unique: false };
                objectStore.createIndex(index.name, index.key, options);
            });
        }
    }

    getObjectStore(objectStoreName: string, readMode: string, reject?: Function) {
        let transaction = this._currentDb.transaction([objectStoreName], readMode);
        if (reject) { handleFail(transaction, reject); }
        return transaction.objectStore(objectStoreName);
    }

    insert(objectStoreName: string, data: any) {
        return new Promise((resolve, reject) => {
            if (!this._currentDb) { throw new Error('Require a connection opened'); }
            if (this._currentConfig && this._currentConfig.created) {
                let date = Date.now();
                data.created = date;
                data.modified = date;
            }

            let store = this.getObjectStore(objectStoreName, 'readwrite', reject);

            if (store) {
                let request = store.add(data); // add
                handleFail(request, reject);
                request.onsuccess = (e) => { resolve(e.target.result); };
            }
        });
    }

    update(objectStoreName: string, key: any, data: any) {
        return new Promise((resolve, reject) => {
            if (!this._currentDb) { throw new Error('Require a connection opened'); }

            let store = this.getObjectStore(objectStoreName, 'readwrite', reject);

            let request = store.get(key); // get one
            handleFail(request, reject);
            request.onsuccess = (e) => {
                let original = e.target.result;

                if (original) {
                    if (this._currentConfig && this._currentConfig.created) {
                        data.modified = Date.now();
                    }

                    let updateRequest = store.put(data); // put
                    handleFail(updateRequest, reject);
                    updateRequest.onsuccess = () => { resolve(data); };
                }
            };
        });
    }

    delete(objectStoreName, key) {
        return new Promise((resolve, reject) => {
            if (!this._currentDb) { throw new Error('Require a connection opened'); }

            let store = this.getObjectStore(objectStoreName, 'readwrite', reject);

            let request = store.delete(key); // delete
            handleFail(request, reject);
            request.onsuccess = (e) => { resolve(e); };
        });
    }

    count(objectStoreName) {
        return new Promise((resolve, reject) => {
            if (!this._currentDb) { throw new Error('Require a connection opened'); }

            let store = this.getObjectStore(objectStoreName, 'readonly', reject);

            let request = store.count(); // count
            handleFail(request, reject);
            request.onsuccess = (e) => {
                resolve(e.target.result);
            };
        });
    }

    getAll(objectStoreName) {
        return new Promise((resolve, reject) => {
            if (!this._currentDb) { throw new Error('Require a connection opened'); }

            let data = [];
            let store = this.getObjectStore(objectStoreName, 'readonly', reject);

            let countRequest = store.count();
            handleFail(countRequest, reject);

            countRequest.onsuccess = (countEventArgs) => {
                let totalCount = countEventArgs.target.result;

                let cursorRequest = store.openCursor(); // cursor
                handleFail(cursorRequest, reject);

                cursorRequest.onsuccess = (cursorEventArgs) => {
                    let result = cursorEventArgs.target.result;
                    if (result) {
                        let item = result.value;
                        data.push(item);
                        if (data.length === totalCount) { resolve(data); }
                        else { result.continue(); }
                    }
                    else { resolve(data); }
                };
            };
        });
    }

    getOne(objectStoreName, key) {
        return new Promise((resolve, reject) => {
            if (!this._currentDb) { throw new Error('Require a connection opened'); }

            let store = this.getObjectStore(objectStoreName, 'readonly', reject);

            let request = store.get(key); // get one
            handleFail(request, reject);
            request.onsuccess = (e) => { resolve(e.target.result); };
        });
    }
}