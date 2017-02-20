import { OAuth } from './oauth';

export class GoogleAuth extends OAuth {
    constructor(config) {
        super(config);
        this.scope = config.scope || 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
        this.authUrl = config.authUrl || 'https://accounts.google.com/o/oauth2/auth';
        this.profileUrl = config.profileUrl || 'https://www.googleapis.com/oauth2/v1/userinfo';
    }
}
