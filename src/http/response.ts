import { HttpRequest } from './request';

export class HttpResponse {
    headers: any;
    body: any;
    status: number;
    statusText: string;
    url: string;
    /*
    RESPONSE
    - headers
    - body
    - status https://fr.wikipedia.org/wiki/Liste_des_codes_HTTP
    - is success status code:
        - GET => 200
        - POST => 201
        - PUT => 200
        - DELETE => 200 | 204
        - HEAD => 200
        - PATCH => 200
        - OPTIONS => 204
    */
    get isSuccessStatusCode(): boolean {
        return this.status >= 200 && this.status <= 299;
    }

    getHeader(header) {
        return this.headers[header];
    }
}