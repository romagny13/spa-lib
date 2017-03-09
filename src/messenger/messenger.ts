import { isUndefined, isFunction } from '../util';

export class Messenger {
    _cache: any;

    constructor() {
        this._cache = {};
    }

    getSubscribers(event: any): any[] {
        return this._cache[event];
    }

    isRegistered(event: any): boolean {
        return this._cache.hasOwnProperty(event);
    }

    subscribe(event: any, subscriber: Function): void {
        if (isUndefined(event)) throw new Error('Event required');
        if (isUndefined(subscriber)) throw new Error('Subscriber required');

        if (!this.isRegistered(event)) { this._cache[event] = []; }
        this._cache[event].push(subscriber);
    }

    publish(event: any, ...results): void {
        if (this.isRegistered(event)) {
            this._cache[event].forEach((subscriber) => {
                subscriber(...results);
            });
        }
    }

    unsubscribe(event: any, subscriber?: Function): boolean {
        if (isUndefined(event)) throw new Error('Event required');

        if (this.isRegistered(event)) {
            if (isFunction(subscriber)) {
                let index = this._cache[event].indexOf(subscriber);
                if (index !== -1) {
                    this._cache[event].splice(index, 1);
                    return true;
                }
            }
            else {
                delete this._cache[event];
                return true;
            }
        }
        return false;
    }

    clear(): void {
        this._cache = {};
    }
}
