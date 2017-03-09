import { isString, isFunction } from '../util';
import { HttpRequest } from './request';
import { HttpResponse } from './response';

export function isValidMethod(value: string) {
    return /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)$/i.test(value);
}

export interface HttpInterceptor {
    before(request: HttpRequest, next: Function): void;
    after(response: HttpResponse, next: Function): void;
}

export function createXhr(): XMLHttpRequest {
    return new XMLHttpRequest();
}

export function createRequest(method: string, url: string, jsonContent?: string, access_token?: string): HttpRequest {
    const request = new HttpRequest({ method, url });
    if (jsonContent) {
        request.addHeader('content-type', 'application/json');
        request.body = jsonContent;
    }
    if (access_token) {
        request.addHeader('Authorization', 'Bearer ' + access_token);
    }
    return request;
}

export function extractResponseHeaders(headersString: string): any {
    let result = {};
    let headerSplits = headersString.trim().split('\r\n');
    headerSplits.forEach((headerString) => {
        let keyValue = headerString.split(': ');
        if (keyValue[1]) {
            result[keyValue[0]] = keyValue[1];
        }
    });
    return result;
}

export function getHooks(type: string, interceptors: HttpInterceptor[]) {
    let hooks = [];
    interceptors.forEach((interceptor) => {
        if (isFunction(interceptor[type])) {
            hooks.push(interceptor[type]);
        }
    });
    return hooks;
}

export function createResponse(xhr: XMLHttpRequest, request: HttpRequest): HttpResponse {
    const response = new HttpResponse();
    response.status = xhr.status;
    response.headers = extractResponseHeaders(xhr.getAllResponseHeaders());
    response.body = request.responseType ? xhr.response : xhr.responseText;
    return response;
}

export function sendRequest(request: HttpRequest, next: Function) {
    const xhr = createXhr();
    if (xhr) {
        let method = request.method.toUpperCase(),
            handler = () => {
                next(createResponse(xhr, request));
            };

        // abort
        request.abort = () => {
            xhr.abort();
        };

        // progress
        if (request.progress) {
            if (method === 'GET') {
                xhr.addEventListener('progress', request.progress);
            } else if (method === 'POST' || method === 'PUT') {
                xhr.upload.addEventListener('progress', request.progress);
            }
        }

        // open
        xhr.open(method, request.url, request.async);

        // headers
        if (request.headers) {
            for (let header in request.headers) {
                if (request.headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, request.headers[header]);
                }
            }
        }

        // response type
        if (request.responseType) {
            xhr.responseType = request.responseType;
        }

        // timeout (milliseconds)
        if (request.timeout) {
            xhr.timeout = request.timeout;
        }

        // credentials
        if (request.credentials === true) {
            xhr.withCredentials = true;
        }

        // error | abort | timeout => status code 0
        xhr.onload = handler;
        xhr.onabort = handler;
        xhr.onerror = handler;
        xhr.ontimeout = handler;
        // send
        xhr.send(request.body);
    }
    else { throw new Error('XMLHttpRequest not supported'); }
}


