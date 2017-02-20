import { isFunction } from '../util';
import { nameGenerator } from './util';
import { PromiseBase, PromiseState, PromiseMode } from './promise.base';
import { TSPromise } from './promise';

export class TSPromiseArray extends PromiseBase {
    _promises: TSPromise[];
    _promiseResults: any[];
    _pendingNotify: any[];
    _mode: PromiseMode;
    onNotify: Function;
    constructor(promises: TSPromise[], mode: PromiseMode) {
        super();
        /*
            mode all
            promise with array of promises
            handle success if all promises are resolved
            - and if success callback present
            - else set state to wait success callback and pending
            handle error if one promise of array is rejected
            - and if error callback present
            - else set state to wait error callback and pending
            handle notify if notify callback present if set pending notify

            mode race
            handle success or error on first promise resolved / rejected
        */
        this._isCompleted = false;
        this._promiseResults = [];
        this._pendingNotify = [];
        this._mode = mode;
        this._promises = promises;
        if (this._mode === PromiseMode.all) {
            this._iteratePromises(promises);
        }
        else if (this._mode === PromiseMode.race) {
            this._race(promises);
        }
    }

    _handleNotifyAll() {
        if (this._pendingNotify.length > 0) {
            this._pendingNotify.forEach((pendingResult) => {
                this.onNotify(pendingResult);
            });
            this._pendingNotify = [];
        }
    }

    _onNotify(result?: any) {
        if (this.onNotify) {
            this.onNotify(result);
        }
        else {
            this._pendingNotify.push(result);
        }
    }

    _nextPromise(promise: TSPromise, promises: TSPromise[], index: number, length: number) {
        promise.then((result?: any) => {
            this._onNotify(result);
            if (result) { this._promiseResults.push(result); }
            // push result to result array
            index++;
            if (index < length) { this._nextPromise(promises[index], promises, index, length); }
            else { this.resolve(this._promiseResults); }
        }, (reason?: any) => {
            this.reject(reason);
        });
    }

    _iteratePromises(promises: TSPromise[]) {
        let length = promises.length,
            index = 0;
        if (length > 0) { this._nextPromise(promises[0], promises, index, length); }
        else { this.resolve([]); }
    }

    _race(promises: TSPromise[]) {
        promises.forEach((promise) => {
            promise.then((result?: any) => {
                if (!this._isCompleted) {
                    if (result) { this._promiseResults.push(result); }
                    this.resolve(result);
                }
            }, (reason?: any) => {
                this.reject(reason);
            });
        });
    }

    then(onSuccess: Function, onError?: Function, onNotify?: Function): TSPromise {
        this._proxy = new TSPromise();
        this._proxy._parent = this;

        this._id = nameGenerator.getName(this._parent && this._parent._id);
        this._proxy._id = nameGenerator.getName(this._id);

        this.onSuccess = onSuccess;
        this.onError = onError;
        this.onNotify = onNotify;

        // pending notify ?
        if (isFunction(this.onNotify)) {
            this._handleNotifyAll();
        }
        if (this._state === PromiseState.waitSuccessCallBack) {
            this._handleSuccess(this._promiseResults);
        }
        else if (this._state === PromiseState.waitErrorCallBack) {
            if (isFunction(this.onError)) {
                this._handleError(this._pending);
            }
        }
        else {
            this._state = PromiseState.waitResult;
        }

        return this._proxy;
    }

    catch(onError: Function): TSPromise {
        return this.then(this.onSuccess, onError, this.onNotify);
    }
}
