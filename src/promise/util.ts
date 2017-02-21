export class IdGen {
    _cache: any;
    _cacheSize: number;
    _currentSize: number;
    constructor() {
        this._cache = {};
        this._cacheSize = 100;
    }
    _generateKey() {
        return '__p_' + Math.random().toString(36).substr(2, 9);
    }
    _retrieve(key: string) {
        if (this._cache.hasOwnProperty(key)) {
            return this._cache[key];
        }
    }
    _checkCacheSize() {
        if (this._currentSize === this._cacheSize) {
            this.clear();
        }
    }
    getNewId() {
        this._checkCacheSize();
        const key = this._generateKey();
        const id = key + '.0';
        this._cache[key] = [id];
        this._currentSize++;
        return id;
    }
    getId(id?: string) {
        if (typeof id === 'string') {
            let key = id.split('.')[0];
            let cached = this._retrieve(key);
            if (cached) {
                let newId = key + '.' + cached.length;
                this._cache[key].push(newId);
                return newId;
            }
        }
        return this.getNewId();
    }
    clear() {
        this._cache = {};
        this._currentSize = 0;
    }
}

export const idGen = new IdGen();