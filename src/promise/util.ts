
export class IdGen {
    _cache: any;
    constructor() {
        this._cache = {};
    }
    _generateKey() {
        return '__p_' + Math.random().toString(36).substr(2, 9);
    }
    _retrieve(key: string) {
        if (this._cache.hasOwnProperty(key)) {
            return this._cache[key];
        }
    }
    getNewId() {
        const key = this._generateKey();
        const id = key + '.0';
        this._cache[key] = [id];
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
}

export const idGen = new IdGen();