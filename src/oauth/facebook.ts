import { OAuth } from './oauth';

export class FacebookAuth extends OAuth {
    constructor(config) {
        super(config);
        this.scope = config.scope || 'public_profile,email';
        this.authUrl = config.authUrl || 'https://www.facebook.com/dialog/oauth';
        this.profileUrl = config.profileUrl || 'https://graph.facebook.com/me';
        this.fields = config.fields || 'id,name,email';
    }
}