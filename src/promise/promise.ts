import { isFunction } from '../util';
import { idGen } from './util';
import { PromiseBase, PromiseState, PromiseMode } from './promise.base';
import { TSPromiseArray } from './promise.array';

export class TSPromise extends PromiseBase {
    constructor(fn?: Function, id?: string) {
        super();
        if (!id) {
            this._id = idGen.getNewId();
        }
        else {
            this._id = idGen.getId(id);
        }
        try {
            if (isFunction(fn)) {
                fn((result?: any) => {
                    // resolve
                    this.resolve(result);
                }, (reason?: any) => {
                    // reject
                    this.reject(reason);
                });
            }
        } catch (e) {
            this._handleException(e);
        }
    }

    then(onSuccess: Function, onError?: Function): TSPromise {
        this._proxy = new TSPromise(null, this._id);
        this._proxy._parent = this;

        this.onSuccess = onSuccess;
        this.onError = onError;

        if (this._state === PromiseState.waitSuccessCallBack) {
            this._handleSuccess(this._pending);
        }
        else if (this._state === PromiseState.waitErrorCallBack) {
            if (this.onError) {
                this._handleError(this._pending);
            }
        }
        else {
            // wait for result
            this._state = PromiseState.waitResult;
        }

        return this._proxy;
    }

    catch(onError: Function) {
        return this._parent.then(null, onError);
    }

    static all(promises: any[]) {
        return new TSPromiseArray(promises, PromiseMode.all);
    }

    static race(promises: any[]) {
        return new TSPromiseArray(promises, PromiseMode.race);
    }
}

