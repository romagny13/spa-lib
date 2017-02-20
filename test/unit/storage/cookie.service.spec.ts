import { assert } from 'chai';
import { CookieService, getExpirationDateString } from '../../../src/storage';

/*
Should create a cookie
Should find a cookie
Should check if a cookie exists
Should delete a cookie
Should clear all cookies
*/

describe('CookieService', () => {

    let cookieService = new CookieService();
    let name = 'mycookie';
    let value = 'my cookie value';

    it('Should create a cookie', () => {
        cookieService.set(name, value, 10);
        assert.isTrue(cookieService.has(name));
    });

    it('Should get a cookie', () => {
        let result = cookieService.get(name);
        assert.equal(result, value);
    });

    it('Should delete a cookie', () => {
        let result = cookieService.delete(name);
        assert.isFalse(cookieService.has(name));
    });

    it('Should clear cookies', () => {
        let name1 = 'cookie1';
        let name2 = 'cookie2';
        cookieService.set(name1, 'my cookie value 1', 10);
        cookieService.set(name2, 'my cookie value 2', 10);

        assert.isTrue(cookieService.has(name1));
        assert.isTrue(cookieService.has(name2));

        cookieService.clear();

        assert.isFalse(cookieService.has(name1));
        assert.isFalse(cookieService.has(name2));
    });

});