import { isDefined, isString, isBoolean, isFunction, isNumber } from '../util';
import { isValidMethod, normalizeMethod } from './util';

export class HttpRequest {
    headers: any;
    method: string;
    url: string;
    responseType: string;
    async: boolean;
    body: any;
    progress: EventListenerOrEventListenerObject;
    timeout: number; // milliseconds
    abort: Function;
    credentials: boolean;
    constructor(config) {
        /*
        REQUEST
        - method (GET | POST | PUT | DELETE | HEAD | OPTIONS | PATCH)
        - url (scheme: HOST [ ":" PORT ] [ ABS_PATH [ "?" QUERY ]], http | https)
        - headers => key | value (example 'content-type' 'application/json')
        - body (JSON, Text, XML, HTML => changed content-type)
        */

        // method
        if (config.method) {
            if (!isValidMethod(config.method)) { throw new Error('Invalid http method (GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)'); }
            this.method = normalizeMethod(config.method);
        }
        else {
            this.method = 'GET';
        }

        // url
        if (!isString(config.url)) { throw new Error('Url required'); }
        this.url = config.url;

        // headers
        this.headers = {};
        if (config.headers) {
            for (let header in config.headers) {
                if (config.headers.hasOwnProperty(header)) {
                    this.addHeader(header, config.headers[header]);
                }
            }
        }

        // async
        this.async = isBoolean(config.async) ? config.async : true;

        // body
        this.body = config.body;

        // response type
        if (config.responseType) { this.responseType = config.responseType; }

        // progress
        if (isFunction(config.progress)) {
            this.progress = config.progress;
        }

        // timeout
        if (isNumber(config.timeout)) {
            this.timeout = config.timeout;
        }

        // credentials
        if (isBoolean(config.credentials)) {
            this.credentials = config.credentials;
        }
    }

    addHeader(header, value) {
        this.headers[header] = value;
        return this;
    }

    setResponseType(responseType: string) {
        this.responseType = responseType;
        return this;
    }
}