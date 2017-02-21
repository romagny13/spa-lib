import { isFunction } from '../util';
import { idGen } from './util';
import { TSPromiseBase, PromiseState, createChildPromise, PromiseMode } from './promise.base';
import { TSPromise } from './promise';


export class TSPromiseArray extends TSPromiseBase {
    _promises: TSPromise[];
    _promiseResults: any[];
    _pendingNotify: any[];
    _mode: PromiseMode;
    _onNotify: Function;
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
        this._id = idGen.getNewId();
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

    _notifyPendings() {
        if (this._pendingNotify.length > 0) {
            this._pendingNotify.forEach((pendingResult) => {
                this._onNotify(pendingResult);
            });
            this._pendingNotify = [];
        }
    }

    _doNotification(result?: any) {
        if (this._onNotify) {
            this._onNotify(result);
        }
        else {
            this._pendingNotify.push(result);
        }
    }

    _nextPromise(promise: TSPromise, promises: TSPromise[], index: number, length: number) {
        promise.then((result?: any) => {
            this._doNotification(result);
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
                if (this._state !== PromiseState.completed) {
                    if (result) { this._promiseResults.push(result); }
                    this.resolve(result);
                }
            }, (reason?: any) => {
                this.reject(reason);
            });
        });
    }

    then(onComplete: Function, onReject?: Function, onNotify?: Function): TSPromise {
        this._child = createChildPromise(this, this._id);

        this._onComplete = onComplete;
        this._onReject = onReject;
        this._onNotify = onNotify;

        // pending notify ?
        if (isFunction(this._onNotify)) {
            this._notifyPendings();
        }
        if (this._state === PromiseState.waitCompleteCallBack) {
            this._doComplete(this._promiseResults);
        }
        else if (this._state === PromiseState.waitRejectionCallBack) {
            if (isFunction(this._onReject)) {
                this._doRejection(this._pending);
            }
        }
        else {
            this._state = PromiseState.waitResolveOrReject;
        }

        return this._child;
    }

    catch(onError: Function): TSPromise {
        return this.then(this._onComplete, onError, this._onNotify);
    }
}
