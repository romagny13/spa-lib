import { isUndefined } from '../util';
import { Http, HttpResponse } from '../http';

export class OAuth {
    _http: Http;
    clientId: string;
    redirectUrl: string;
    scope: string;
    authUrl: string;
    profileUrl: string;
    fields: string;

    constructor(config) {
        if (isUndefined(config)) throw new Error('Config required');
        if (isUndefined(config.clientId)) throw new Error('clientId required');
        if (isUndefined(config.redirectUrl)) throw new Error('redirectUrl required');

        this._http = new Http();
        this.clientId = config.clientId;
        this.redirectUrl = config.redirectUrl;
    }

    getCodeUrl() {
        if (isUndefined(this.authUrl)) throw new Error('authUrl required');

        return this.authUrl
            + '?client_id=' + this.clientId
            + '&redirect_uri=' + this.redirectUrl
            + '&scope=' + this.scope
            + '&response_type=code';
    }

    getProfile(access_token: string) {
        if (isUndefined(access_token)) throw new Error('access_token required');
        if (isUndefined(this.profileUrl)) throw new Error('profileUrl required');

        let url = isUndefined(this.fields) ? this.profileUrl : this.profileUrl + '?fields=' + this.fields;
        return new Promise((resolve, reject) => {
            this._http.get(url, access_token).then((response: HttpResponse) => {
                resolve(response.content);
            }).catch((response) => {
                reject(response);
            });
        });
    }

    getTokenUrl() {
        // implicit flow
        // response : http://.../#access_token=ya29.CjCmA3KKBZH7ElidD3j_peoQaPdy2G099Ek6DYuYRfwFqSMXpR3i2_2xSjjHBo6FNNo&token_type=Bearer&expires_in=3600
        if (isUndefined(this.authUrl)) throw new Error('authUrl required');

        return this.authUrl
            + '?client_id=' + this.clientId
            + '&redirect_uri=' + this.redirectUrl
            + '&scope=' + this.scope
            + '&response_type=token';
    };

}


