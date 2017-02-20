import { StorageService } from '../storage/index';

export const Cache = (function () {
    let _container: any = {};
    const storageService = new StorageService();

    class Cache {
        get length(): number {
            return Object.keys(_container).length;
        }

        has(key: string) {
            return _container.hasOwnProperty(key);
        }

        store(key: string, value: any) {
            _container[key] = value;
        }

        retrieve(key: string) {
            if (this.has(key)) {
                return _container[key];
            }
        }

        remove(key: string) {
            if (this.has(key)) {
                delete _container[key];
                return true;
            }
            return false;
        }

        clear() {
            _container = {};
        }

        /**
        * save to local storage
        */
        save(key: string) {
            storageService.set(key, _container);
        }

        /**
        * restore from local storage
        */
        restore(key: string): boolean {
            let cached = storageService.get(key);
            if (cached) {
                _container = cached;
                return true;
            }
            return false;
        }
    }
    return Cache;
})();
