export class Observable {
    _subscribers: Function[];

    constructor(obj, name) {
        let initialValue = obj[name];
        let self = this;
        this._subscribers = [];

        function raise(value) {
            self._subscribers.forEach((subscriber) => {
                subscriber(value);
            });
        }

        Object.defineProperty(obj, name, {
            get: function () {
                return initialValue;
            },
            set: function (value) {
                initialValue = value;
                raise(value);
            },
            enumerable: true,
            configurable: true
        });
    }

    subscribe(subscriber) {
        this._subscribers.push(subscriber);
    }

    unsubscribe(subscriber) {
        let index = this._subscribers.indexOf(subscriber);
        if (index !== -1) {
            this._subscribers.splice(index, 1);
            return true;
        }
        return false;
    }
}

export function observe(obj, name, handler) {
    let observable = new Observable(obj, name);
    observable.subscribe(handler);
    return observable;
}
