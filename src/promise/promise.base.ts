import { TSPromise } from './promise';

export enum PromiseState {
    waitCompleteCallBack, // 0
    waitRejectionCallBack, // 1
    waitResolveOrReject, // 2
    completed, // 3
    none
}

export enum PromiseMode {
    all,
    race
}

export function createChildPromise(parent: any, id?: string): TSPromise {
    let child = new TSPromise(null, id);
    child._parent = parent;
    return child;
}

export abstract class TSPromiseBase {
    _id: string;
    _state: PromiseState;
    _onComplete: Function;
    _onReject: Function;
    _pending: any;
    _child: TSPromise;
    _parent: TSPromiseBase;

    _doComplete(result?: any) {
        try {
            this._pending = undefined;
            this._state = PromiseState.completed;
            let returnValue = this._onComplete(result); // simple function
            // chaining
            this._child.resolve(returnValue);
        }
        catch (error) {
            this._child.reject(error);
        }
    }

    _doRejection(reason?: any) {
        try {
            this._pending = undefined;
            this._state = PromiseState.completed;
            let returnValue = this._onReject(reason);
            // chaining
            this._child.resolve(returnValue);
        }
        catch (error) {
            // handle child
            this._child.reject(error);
        }
    }

    _setPending(state: PromiseState, pending?: any) {
        this._state = state;
        this._pending = pending;
    }

    resolve(result?: any) {
        // resolved
        if (this._onComplete) {
            this._doComplete(result);
        }
        else {
            // pending complete callback
            this._setPending(PromiseState.waitCompleteCallBack, result);
        }
    }

    reject(reason?: any) {
        // rejected
        if (this._onReject) {
            this._doRejection(reason);
        }
        else {
            // pending rejection callback
            this._setPending(PromiseState.waitRejectionCallBack, reason);
        }
    }

    abstract then(onSuccess: Function, onError?: Function, onNotify?: Function): TSPromise;
    abstract catch(onError: Function): TSPromise;
}