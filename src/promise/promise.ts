import { isFunction } from '../util';

enum PromiseResultState {
    completed,
    waitOnResolvedCallback,
    waitOnRejectedCallback
}

enum SpecializedStackItemType {
    onResolved,
    onRejected
}

export class SpecializedStackItem {
    type: SpecializedStackItemType;
    fn: Function;
    constructor(type: SpecializedStackItemType, fn: Function) {
        this.type = type;
        this.fn = fn;
    }
}

export class SpecializedStack {
    _stack: SpecializedStackItem[];
    constructor() {
        this._stack = [];
    }
    _getNextItemIndex(type: SpecializedStackItemType) {
        let length = this._stack.length;
        for (let i = 0; i < length; i++) {
            let item = this._stack[i];
            if (item.type === type) {
                return i;
            }
        }
        return -1;
    }
    _splice(index: number): void {
        this._stack.splice(0, index);
    }
    clear(): void {
        this._stack = [];
    }
    push(type: SpecializedStackItemType, fn: Function): void {
        this._stack.push(new SpecializedStackItem(type, fn));
    }
    next(type: SpecializedStackItemType): SpecializedStackItem {
        let index = this._getNextItemIndex(type);
        if (index !== -1) {
            this._splice(index);
        }
        else {
            this.clear();
        }
        return this._stack.shift();
    }
}

export class TSPromise {
    _root: TSPromise;
    _stack: SpecializedStack;
    _result: any;
    _reason: any;
    _state: PromiseResultState;
    _child: TSChildPromise;
    constructor(executor?: Function) {
        this._root = this;
        this._stack = new SpecializedStack();
        try {
            if (isFunction(executor)) {
                executor((result) => {
                    this.resolve(result);
                }, (reason) => {
                    this.reject(reason);
                });
            }
        }
        catch (error) {
            this.reject(error);
        }
    }

    resolve(result?: any) {
        this._root._result = result;
        let item = this._root._stack.next(SpecializedStackItemType.onResolved);
        if (item) {
            item.fn();
        }
        else {
            this._root._state = PromiseResultState.waitOnResolvedCallback;
        }
    }

    reject(reason?: any) {
        this._root._reason = reason;
        let item = this._root._stack.next(SpecializedStackItemType.onRejected);
        if (item) {
            item.fn();
        }
        else {
            this._root._state = PromiseResultState.waitOnRejectedCallback;
        }
    }

    then(onComplete: Function, onRejection?: Function): TSChildPromise {
        this._child = new TSChildPromise(this._root);

        let self = this;
        function _doCompletion() {
            try {
                let returnValue = onComplete(self._root._result);
                self._child.resolve(returnValue);
            }
            catch (error) {
                self._child.reject(error);
            }
        }

        function _doRejection() {
            try {
                let returnValue = onRejection(self._root._reason);
                self._child.resolve(returnValue);
            }
            catch (error) {
                self._child.reject(error);
            }
        }

        if (isFunction(onComplete)) {
            this._root._stack.push(SpecializedStackItemType.onResolved, () => {
                _doCompletion();
            });
        }
        if (isFunction(onRejection)) {
            this._root._stack.push(SpecializedStackItemType.onRejected, () => {
                _doRejection();
            });
        }

        if (isFunction(onComplete) && this._root._state === PromiseResultState.waitOnResolvedCallback) {
            let item = this._root._stack.next(SpecializedStackItemType.onResolved);
            if (item) {
                item.fn();
            }
        }
        else if (onRejection && this._root._state === PromiseResultState.waitOnRejectedCallback) {
            let item = this._root._stack.next(SpecializedStackItemType.onRejected);
            if (item) {
                item.fn();
            }
        }
        return this._child;
    }

    catch(onRejection: Function): TSChildPromise {
        return this.then(null, onRejection);
    }

    static all(promises: TSPromise[]): TSPromise {
        let results = [],
            isCompleted = false,
            length = promises.length,
            index = 0;
        const promiseAll = new TSPromise();
        for (let i = 0; i < length; i++) {
            let promise = promises[i];
            try {
                promise.then((result?: any) => {
                    if (!isCompleted) {
                        results.push(result);
                        index++;
                        if (index === length) {
                            isCompleted = true;
                            promiseAll.resolve(results);
                        }
                    }
                }, (reason?: any) => {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseAll.reject(reason);
                    }
                });
            } catch (error) {
                isCompleted = true;
                promiseAll.reject(error);
            }
        }
        return promiseAll;
    }

    static race(promises: TSPromise[]): TSPromise {
        let isCompleted = false,
            length = promises.length,
            index = 0;
        const promiseAll = new TSPromise();
        for (let i = 0; i < length; i++) {
            let promise = promises[i];
            try {
                promise.then((result?: any) => {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseAll.resolve(result);
                    }
                }, (reason?: any) => {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseAll.reject(reason);
                    }
                });
            } catch (error) {
                isCompleted = true;
                promiseAll.reject(error);
            }
        }
        return promiseAll;
    }
}

export class TSChildPromise extends TSPromise {
    constructor(root: TSPromise) {
        super();
        this._root = root;
    }
}
