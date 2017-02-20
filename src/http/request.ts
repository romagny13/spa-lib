import { isDefined, isString, isBoolean } from '../util';

export class HttpRequest {
    headers: any;
    method: string;
    url: string;
    responseType: string;
    async: boolean;
    data: any;

    constructor(config) {
        if (!isString(config.url)) { throw new Error('Url required'); }

        this.headers = {};
        if (config.headers) {
            for (let header in config.headers) {
                this.addHeader(header, config.headers[header]);
            }
        }

        this.url = config.url;
        this.method = isString(config.method) && /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)$/i.test(config.method) ? config.method : 'GET';
        this.async = isBoolean(config.async) ? config.async : true;
        this.data = isDefined(config.data) ? config.data : null;
        if (config.responseType) { this.responseType = config.responseType; }
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