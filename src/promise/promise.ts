import { isFunction } from '../util';
import { idGen } from './util';
import { TSPromiseBase, PromiseState, createChildPromise, PromiseMode } from './promise.base';
import { TSPromiseArray } from './promise.array';

export class TSPromise extends TSPromiseBase {
    constructor(fn?: Function, id?: string) {
        super();
        if (!id) { this._id = idGen.getNewId(); }
        else { this._id = idGen.getId(id); }
        if (isFunction(fn)) {
            try {
                fn((result: any) => {
                    // resolved
                    this.resolve(result);
                }, (reason: any) => {
                    // rejected
                    this.reject(reason);
                });
            }
            catch (error) {
                this.reject(error);
            }
        }
    }

    then(onComplete: Function, onReject?: Function): TSPromise {
        this._child = createChildPromise(this, this._id);

        this._onComplete = onComplete;
        this._onReject = onReject;

        if (this._state === PromiseState.waitCompleteCallBack) {
            this._doComplete(this._pending);
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

    catch(onReject: Function): TSPromise {
        // parent is root ?
        if (this._parent._state === PromiseState.completed) {
            return this.then(this._onComplete, onReject);
        }
        else {
            return this._parent.then(this._onComplete, onReject);
        }
    }

    static all(promises: any[]): TSPromiseArray {
        return new TSPromiseArray(promises, PromiseMode.all);
    }

    static race(promises: any[]): TSPromiseArray {
        return new TSPromiseArray(promises, PromiseMode.race);
    }
}
