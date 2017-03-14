import { isString, isNumber, isBoolean } from '../util';
import { getExpirationDateString } from './util';

export class CookieService {
    set(name: string, value: string, expirationDays?: number, path?: string, domain?: string, secure?: boolean) {
        if (!isString(name)) throw new Error('Name required');
        if (!isString(value)) throw new Error('String value required');
        if (!isNumber(expirationDays)) { expirationDays = 30; }
        const newCookie = [];
        newCookie.push(name + '=' + encodeURIComponent(value));
        newCookie.push('expires=' + getExpirationDateString(expirationDays));
        if (isString(path)) {
            newCookie.push('path=' + path);
        }
        if (isString(domain)) {
            newCookie.push('domain=' + domain);
        }
        if (secure === true) {
            newCookie.push('secure');
        }
        // set cookie
        document.cookie = newCookie.join('; ');
    }
    get(name: string) {
        if (!isString(name)) throw new Error('Name required');

        let stored = document.cookie.split(';');
        for (let i = 0; i < stored.length; i++) {
            let nameAndValue = stored[i].split('=');
            if (nameAndValue[0].trim() === name) {
                return decodeURIComponent(nameAndValue[1].trim());
            }
        }
    }
    has(name: string): boolean {
        if (!isString(name)) throw new Error('Name required');
        return this.get(name) !== undefined;
    }
    delete(name: string): boolean {
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