import { isString, isObject } from '../util';
import { tryGetObject } from './util';

export class StorageService {
    _storage: any;
    _strategy: string;
    constructor(strategy?: string) {
        this._strategy = isString(strategy) && /^(local|session)$/i.test(strategy) ? strategy : 'local';
        if (this._strategy === 'local') {
            this._storage = localStorage;
        }
        else {
            this._storage = sessionStorage;
        }
    }

    set(key: string, value: any) {
        try {
            let data = isObject(value) ? JSON.stringify(value) : value;
            this._storage[key] = data;
        }
        catch (e) { }
    }

    get(key: string) {
        let value = this._storage[key];
        let result = tryGetObject(value);
        if (result) { return result; }
        else { return value; }
    }

    has(key: string) {
        return this._storage[key] !== undefined;
    }

    remove(key: string): boolean {
        if (this.has(key)) {
            this._storage.removeItem(key);
            return true;
        }
        return false;
    }

    getValues() {
        const result = [];
        for (let i = 0; i < this._storage.length; i++) {
            let value = this.get(this._storage.key(i));
            result.push(value);
        }
        return result;
    }

    getKeys() {
        return Object.keys(this._storage);
    }

    clear() {
        this._storage.clear();
    }
}
