import { TSPromise } from './promise';

export enum PromiseState {
    done,
    fail,
    waitResult,
    waitSuccessCallBack,
    waitErrorCallBack,
    none
}

export enum PromiseMode {
    all,
    race
}

export abstract class PromiseBase {
    _state: PromiseState;
    _proxy: TSPromise;
    _parent: PromiseBase;
    _id: string;
    _pending: any;
    _pendingNotify: any[];
    _isCompleted: boolean;
    onSuccess: Function;
    onError: Function;

    _setPending(state: PromiseState, pending?: any) {
        this._state = state;
        this._pending = pending;
    }

    _handleSuccess(result?: any) {
        let subResult;
        try {
            this._isCompleted = true;
            subResult = this.onSuccess(result);
            this._state = PromiseState.done;
            // chaining
            this._proxy.resolve(subResult);
        } catch (e) {
            this._handleException(e);
        }
    }

    _handleError(reason?: any) {
        let subResult;
        try {
            this._isCompleted = true;
            subResult = this.onError(reason);
            this._state = PromiseState.fail;
            this._proxy.resolve(subResult);
        } catch (e) {
            this._handleException(e);
        }
    }

    resolve(result?: any) {
        // success callback present ?
        if (this._state === PromiseState.waitResult) {
            this._handleSuccess(result);
        }
        else {
            // pending
            this._setPending(PromiseState.waitSuccessCallBack, result);
        }
    }

    reject(reason?: any) {
        if (this._state === PromiseState.waitResult) {
            // at first error
            this._handleError(reason);
        }
        else {
            this._setPending(PromiseState.waitErrorCallBack, reason);
        }
    }

    _handleException(error?: any) {
        if (this._isCompleted) {
            this._proxy.reject(error);
        }
        else {
            this.reject(error);
        }
    }

    abstract then(onSuccess: Function, onError?: Function, onNotify?: Function): TSPromise;
    abstract catch(onError: Function): TSPromise;
}
