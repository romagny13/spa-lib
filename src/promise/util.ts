
export class NameGenerator {
    _cache: any;
    constructor() {
        this._cache = {};
    }

    _generateRandomName() {
        return Math.random().toString(36).substr(2, 9);
    }

    _store(name, id) {
        if (!this._cache[name]) { this._cache[name] = []; }
        this._cache[name].push(id);
    }

    _retrieve(name) {
        if (this._cache.hasOwnProperty(name)) {
            return this._cache[name];
        }
    }

    _extractName(value) {
        let r = /^__p__.([a-z0-9]+).__[0-9]+__$/.exec(value);
        if (r) {
            return r[1];
        }
    }

    getNewName() {
        let name = this._generateRandomName();
        let id = '__p__.' + name + '.__' + 0 + '__';
        this._store(name, id);
        return id;
    }

    getName(p?: string) {
        if (typeof p === 'string') {
            let extractedName = this._extractName(p);
            if (extractedName) {
                let stack = this._retrieve(extractedName);
                if (stack) {
                    let id = '__p__.' + extractedName + '.__' + stack.length + '__';
                    this._store(extractedName, id);
                    return id;
                }
            }
        }
        return this.getNewName();
    }

    clear() {
        this._cache = {};
    }
}

export const nameGenerator = new NameGenerator();