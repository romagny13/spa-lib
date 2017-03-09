import { isArray, isBoolean, isString } from '../util';
import { isValidValidationType } from './util';
import { FormElementConfig } from './form-element.config';
import { Validator } from './validators';

export class FormConfig {
    validationType: string; // by default submit or valuechanged
    formElementConfigs: any;
    showErrorMessages: boolean;
    cssClassOnSuccess: boolean;
    cssClassOnError: boolean;
    constructor(validationType?: string, showErrorMessages?: boolean, cssClassOnSuccess?: boolean, cssClassOnError?: boolean) {
        this.validationType = isString(validationType) && isValidValidationType(validationType) ? validationType : 'submit';
        this.formElementConfigs = {};
        this.showErrorMessages = isBoolean(showErrorMessages) ? showErrorMessages : true;
        this.cssClassOnSuccess = isBoolean(cssClassOnSuccess) ? cssClassOnSuccess : true;
        this.cssClassOnError = isBoolean(cssClassOnError) ? cssClassOnError : true;
    }

    addFormElementConfig(name: string, validators: Validator[], updateType?: string) {
        const config = new FormElementConfig(name, updateType);
        if (isArray(validators)) {
            validators.forEach((validator) => {
                config.addValidator(validator);
            });
        }
        this.formElementConfigs[config.name] = config;
        return this;
    }

    getFormElementConfig(name: string): FormElementConfig {
        if (this.formElementConfigs.hasOwnProperty(name)) {
            return this.formElementConfigs[name];
        }
    }
}