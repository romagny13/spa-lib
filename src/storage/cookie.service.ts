import { isString, isNumber } from '../util';
import { getExpirationDateString } from './util';

export class CookieService {
    set(name: string, value: string, expiration?: number) {
        if (!isString(name)) throw new Error('Name required');
        if (!isString(value)) throw new Error('String value required');
        if (!isNumber(expiration)) { expiration = 30; }
        document.cookie = name + '=' + value + ';expires=' + getExpirationDateString(expiration);
    }
    get(name: string) {
        if (!isString(name)) throw new Error('Name required');

        let stored = document.cookie.split(';');
        for (let i = 0; i < stored.length; i++) {
            let nameAndValue = stored[i].split('=');
            if (nameAndValue[0].trim() === name) {
                return nameAndValue[1].trim();
            }
        }
    }
    has(name: string) {
        if (!isString(name)) throw new Error('Name required');
        return this.get(name) !== undefined;
    }
    delete(name: string) {
        if (this.has(name)) {
            this.set(name, '', -1);
            return true;
        }
        return false;
    }
    clear() {
        let stored = document.cookie.split(';');
        for (let i = 0; i < stored.length; i++) {
            let name = stored[i].split('=')[0];
            this.set(name, '', -1);
        }
    }
}