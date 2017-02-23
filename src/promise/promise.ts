import { isFunction } from '../util';
import { SpecializedStack, SpecializedStackItem, SpecializedStackItemType } from './stack';

enum PromiseResultState {
    completed,
    waitOnResolvedCallback,
    waitOnRejectedCallback
}

export function resolve(root: TSPromise, result?: any) {
    root._result = result;
    let item = root._stack.next(SpecializedStackItemType.onResolved);
    if (item) {
        item.fn();
    }
    else {
        root._state = PromiseResultState.waitOnResolvedCallback;
    }
}

export function reject(root: TSPromise, reason?: any) {
    root._reason = reason;
    let item = root._stack.next(SpecializedStackItemType.onRejected);
    if (item) {
        item.fn();
    }
    else {
        root._state = PromiseResultState.waitOnRejectedCallback;
    }
}

export function then(root: TSPromise, promise: TSPromiseBase, onComplete: Function, onRejection?: Function): TSChildPromise {
    let hasComplete = isFunction(onComplete),
        hasRejection = isFunction(onRejection);
    promise._child = new TSChildPromise(root);
    function _doCompletion() {
        try {
            let returnValue = onComplete(root._result);
            promise._child.resolve(returnValue);
        }
        catch (error) {
            promise._child.reject(error);
        }
    }

    function _doRejection() {
        try {
            let returnValue = onRejection(root._reason);
            promise._child.resolve(returnValue);
        }
        catch (error) {
            promise._child.reject(error);
        }
    }

    if (hasComplete) {
        root._stack.push(SpecializedStackItemType.onResolved, () => {
            _doCompletion();
        });
    }
    if (hasRejection) {
        root._stack.push(SpecializedStackItemType.onRejected, () => {
            _doRejection();
        });
    }

    if (hasComplete && root._state === PromiseResultState.waitOnResolvedCallback) {
        let item = root._stack.next(SpecializedStackItemType.onResolved);
        if (item) {
            item.fn();
        }
    }
    else if (hasRejection && root._state === PromiseResultState.waitOnRejectedCallback) {
        let item = root._stack.next(SpecializedStackItemType.onRejected);
        if (item) {
            item.fn();
        }
    }
    return promise._child;
}

export class TSPromiseBase {
    _child: TSChildPromise;
}

export class TSPromise extends TSPromiseBase {
    _stack: SpecializedStack;
    _result: any;
    _reason: any;
    _state: PromiseResultState;
    constructor(executor?: Function) {
        super();
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

    resolve(result?: any): void {
        resolve(this, result);
    }

    reject(reason?: any): void {
        reject(this, reason);
    }

    then(onComplete: Function, onRejection?: Function): TSChildPromise {
        return then(this, this, onComplete, onRejection);
    }

    catch(onRejection: Function): TSChildPromise {
        return then(this, this, null, onRejection);
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
        const promiseRace = new TSPromise();
        for (let i = 0; i < length; i++) {
            let promise = promises[i];
            try {
                promise.then((result?: any) => {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseRace.resolve(result);
                    }
                }, (reason?: any) => {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseRace.reject(reason);
                    }
                });
            } catch (error) {
                isCompleted = true;
                promiseRace.reject(error);
            }
        }
        return promiseRace;
    }
}

export class TSChildPromise extends TSPromiseBase {
    _root: TSPromise;
    constructor(root: TSPromise) {
        super();
        this._root = root;
    }

    resolve(result?: any): void {
        resolve(this._root, result);
    }

    reject(reason?: any): void {
        reject(this._root, reason);
    }

    then(onComplete: Function, onRejection?: Function): TSChildPromise {
        return then(this._root, this, onComplete, onRejection);
    }

    catch(onRejection: Function): TSChildPromise {
        return then(this._root, this, null, onRejection);
    }
}
