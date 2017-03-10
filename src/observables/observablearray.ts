import { isUndefined, isArray, isNumber } from '../util';

export class ObservableArray {
    _subscribers: Function[];
    _array: any[];

    constructor(array: any[]) {
        let self = this;
        function raise(type, value, index) {
            self._subscribers.forEach((subscriber) => {
                subscriber(type, value, index);
            });
        }

        if (!isArray(array)) { throw new TypeError('Array required'); }
        this._subscribers = [];
        this._array = array;

        // insert at the end of the array each argument
        array.push = function () {
            for (let i = 0; i < arguments.length; i++) {
                let item = arguments[i];
                let index = this.length;
                Array.prototype.push.call(this, item);
                raise('added', item, index);
            }
            return this.length;
        };

        // insert to the beginning each argument
        array.unshift = function () {
            for (let i = 0; i < arguments.length; i++) {
                let item = arguments[i];
                this.splice(i, 0, item);
            }
            return this.length;
        };

        // from start index, delete x items, then insert next arguments and return an array with all removed items
        array.splice = function (start: any, deleteCount?: any, ...items: any[]): any[] {
            if (!isNumber(start) || !isNumber(deleteCount)) { return []; }

            let removedItems = [];
            // remove
            let endIndex = start + deleteCount;
            for (let i = start; i < endIndex; i++) {
                // index always start because we removed an item
                let item = Array.prototype.splice.call(this, start, 1)[0];
                removedItems.push(item);
                raise('removed', item, i);
            }

            // insert
            items.forEach((item, i) => {
                Array.prototype.splice.call(this, start, 0, item);
                raise('added', item, i);
                start++;
            });
            return removedItems;
        };


        // remove and return the first item (inverse of pop)
        array.shift = function () {
            if (this.length > -1) {
                let item = Array.prototype.shift.call(this);
                raise('removed', item, 0);
                return item;
            }
        };

        // remove and return the last item
        array.pop = function () {
            let index = this.length - 1;
            if (index > -1) {
                let item = Array.prototype.pop.call(this);
                raise('removed', item, index);
                return item;
            }
        };

        array.sort = function (fn) {
            Array.prototype.sort.call(this, fn);
            raise('sorted', this, null);
            return this;
        };

        array.filter = function (fn: Function) {
            let result = [];
            this.forEach((current) => {
                if (fn(current) === true) {
                    result.push(current);
                }
            });
            raise('filtered', result, null);
            return result;
        };

        array['resetFilter'] = function () {
            raise('filtered', this, null);
            return this;
        };

    }

    subscribe(subscriber: Function) {
        this._subscribers.push(subscriber);
    }

    unsubscribe(subscriber: Function) {
        let index = this._subscribers.indexOf(subscriber);
        if (index !== -1) {
            this._subscribers.splice(index, 1);
            return true;
        }
        return false;
    }
}

export function observeArray(array, handler) {
    let observableArray = new ObservableArray(array);
    observableArray.subscribe(handler);
    return observableArray;
}