import { assert } from 'chai';
import { Cache } from '../../../src/cache/cache';

/*
 Should register item by key
 Should retrieve item by key
 Check if an item is registered
 Should clear
 Should save to local storage
 Should restore from local storage
 */

describe('Cache', () => {

    const cache = new Cache();

    it('Should register item by key', () => {
        let k = 'k1';
        let item = { name: 'my value' };
        cache.store(k, item);
        assert.isTrue(cache.has(k));
    });

    it('Check if an item is not registered', () => {
        assert.isFalse(cache.has('myNotregisteredItem'));
    });

    it('Should get item', () => {
        let result = cache.retrieve('k1');
        assert.equal(result.name, 'my value');
    });

    it('Could count items', () => {
        assert.equal(cache.length, 1);
    });

    it('Should save to local storage', () => {
        let k = '__cache';
        cache.save(k);
        let item = localStorage.getItem(k);
        assert.isNotNull(item);
    });

    it('Should remove', () => {
        let ck = 'k1';
        cache.remove(ck);
        assert.isFalse(cache.has(ck));
    });

    it('Should restore from local storage', () => {
        let ck = '__cache';
        let k = 'k1';
        cache.restore(ck);
        assert.equal(cache.length, 1);
        let result = cache.retrieve(k);
        assert.equal(result.name, 'my value');
        cache.remove(k);
    });

    it('Should clear', () => {
        cache.store('k3', () => { });
        cache.store('k4', () => { });
        assert.equal(cache.length, 2);
        cache.clear();
        assert.equal(cache.length, 0);
    });

});
