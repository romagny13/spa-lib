import { isUndefined, isArray } from '../util';

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
                let index = array.length;
                Array.prototype.push.call(array, item);
                raise('added', item, index);
            }
            return array.length;
        };

        // insert to the beginning each argument
        array.unshift = function () {
            for (let i = 0; i < arguments.length; i++) {
                let item = arguments[i];
                array.splice(i, 0, item);
                raise('added', item, i);
            }
            return array.length;
        };

        // from start index, delete x items, then insert next arguments and return an array with all removed items
        array.splice = function (start: any, deleteCount?: any, ...items: any[]): any[] {
            let removedItems = [];
            if (isUndefined(start) || isUndefined(deleteCount)) return removedItems;

            // remove
            while (deleteCount--) { // 2 .. 1 ..  0
                let index = deleteCount + start;
                let item = Array.prototype.splice.call(this, index, 1)[0];
                raise('removed', item, index);
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
            if (array.length > -1) {
                let item = Array.prototype.shift.call(this);
                raise('removed', item, 0);
                return item;
            }
        };

        // remove and return the last item
        array.pop = function () {
            let index = array.length - 1;
            if (index > -1) {
                let item = Array.prototype.pop.call(this);
                raise('removed', item, index);
                return item;
            }
        };

        array.sort = function (fn) {
            Array.prototype.sort.call(this, fn);
            raise('sorted', array, null);
            return array;
        };

        array.filter = function (fn: Function) {
            let result = [];
            array.forEach((current) => {
                if (fn(current)) result.push(current);
            });
            raise('filtered', result, null);
            return result;
        };

        array['resetFilter'] = function () {
            raise('filtered', array, null);
            return array;
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
