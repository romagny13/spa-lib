import { isUndefined, isFunction } from '../util';
import { HttpRequest } from './request';
import { HttpResponse } from './response';
import { sendRequest, createRequest, getHooks, HttpInterceptor } from './util';

export class Http {
    interceptors: HttpInterceptor[];

    constructor() {
        this.interceptors = [];
    }

    intercept(type: string, r: HttpRequest | HttpResponse, onComplete: Function, onAbort: Function) {
        let hooks = getHooks(type, this.interceptors),
            length = hooks.length,
            index = 0;

        function next(hook) {
            hook(r, (canContinue) => {
                if (canContinue) {
                    index++;
                    if (index < length) { next(hooks[index]); }
                    else { onComplete(); }
                }
                else {
                    onAbort();
                }
            });
        }

        if (length > 0) { next(hooks[0]); }
        else if (onComplete) { onComplete(); }
    }

    load(url: string, onSuccess: Function, onError?: Function) {
        if (isUndefined(url)) { throw new Error('Url required'); }
        const request = new HttpRequest({ url });
        sendRequest(request, (response: HttpResponse) => {
            if (response.status === 200) {
                onSuccess(response.content);
            }
            else {
                if (onError) { onError(response); }
            }
        });
    }

    send(request: HttpRequest) {
        return new Promise((resolve, reject) => {
            this.intercept('before', request, () => {
                try {
                    sendRequest(request, (response: HttpResponse) => {
                        this.intercept('after', response, () => {
                            if (response.isSuccessStatusCode) {
                                resolve(response);
                            }
                            else {
                                reject(response);
                            }

                        }, () => {
                            reject(response);
                        });
                    });
                } catch (error) {
                    reject(error);
                }
            }, () => {
                const response = new HttpResponse();
                response.status = 401;
                reject(response);
            });
        });
    }

    get(url: string, access_token?: string) {
        const request = createRequest('GET', url, null, access_token);
        return this.send(request);
    };

    post(url: string, jsonContent?: string, access_token?: string) {
        const request = createRequest('POST', url, jsonContent, access_token);
        return this.send(request);
    };

    put(url: string, jsonContent?: string, access_token?: string) {
        const request = createRequest('PUT', url, jsonContent, access_token);
        return this.send(request);
    };

    delete(url: string, access_token?: string) {
        const request = createRequest('DELETE', url, null, access_token);
        return this.send(request);
    };

}