import { assert } from 'chai';
import { StorageService } from '../../../src/storage';

/*
Local / Session:
Should set an item by key
Should retrieve an item by key
Should check if an item exists
Should remove a stored item by key
Should store and retrieve the object
Should clear storage
*/

describe('StorageService', () => {

    describe('local', () => {
        let localService = new StorageService();

        it('Should set an item', () => {
            let key = 'k1';
            let value = 'local value 1';
            localService.set(key, value);
            assert.isTrue(localService.has(key));
        });

        it('Should get item', () => {
            let item = localService.get('k1');
            assert.equal(item, 'local value 1');
        });

        it('Should store in localStorage', () => {
            let item = localStorage.getItem('k1');
            assert.equal(item, 'local value 1');
        });

        it('Should store an object', () => {
            let key = 'k2';
            let value = { 'name': 'local name value' };
            localService.set(key, value);
            let item = localService.get(key);
            assert.isTrue(localService.has(key));
            assert.equal(item.name, value.name);
        });

        it('Should store an array', () => {
            let key = 'k3';
            let value = ['a', 'b', 'c'];
            localService.set(key, value);
            let item = localService.get(key);
            assert.isTrue(localService.has(key));
            assert.equal(item.length, 3);
            assert.equal(item[1], 'b');
        });

        it('Should remove an item', () => {
            let key = 'k1';
            localService.remove(key);
            assert.isFalse(localService.has(key));
        });

        it('Should clear storage', () => {
            localService.clear();
            assert.isFalse(localService.has('k2'));
            assert.isFalse(localService.has('k3'));
        });
    });

    describe('session', () => {
        let sessionService = new StorageService('session');

        it('Should set an item', () => {
            let key = 'k1';
            let value = 'session value 1';
            sessionService.set(key, value);
            assert.isTrue(sessionService.has(key));
        });

        it('Should get item', () => {
            let item = sessionService.get('k1');
            assert.equal(item, 'session value 1');
        });

        it('Should store in sessionStorage', () => {
            let item = sessionStorage.getItem('k1');
            assert.equal(item, 'session value 1');
        });

        it('Should store an object', () => {
            let key = 'k2';
            let value = { 'name': 'session name value' };
            sessionService.set(key, value);
            let item = sessionService.get(key);
            assert.isTrue(sessionService.has(key));
            assert.equal(item.name, value.name);
        });

        it('Should store an array', () => {
            let key = 'k3';
            let value = ['a', 'b', 'c'];
            sessionService.set(key, value);
            let item = sessionService.get(key);
            assert.isTrue(sessionService.has(key));
            assert.equal(item.length, 3);
            assert.equal(item[1], 'b');
        });

        it('Should remove an item', () => {
            let key = 'k1';
            sessionService.remove(key);
            assert.isFalse(sessionService.has(key));
        });

        it('Should clear storage', () => {
            sessionService.clear();
            assert.isFalse(sessionService.has('k2'));
            assert.isFalse(sessionService.has('k3'));
        });
    });
});
