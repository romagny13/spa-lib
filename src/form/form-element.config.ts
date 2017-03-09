import { isString, isBoolean } from '../util';
import { isValidUpdateType } from './util';
import { Validator } from './validators';

export class FormElementConfig {
    name: string; // target form element name and source property name
    updateType: string; // valuechanged by default or lostfocus
    validators: any[];
    constructor(name: string, updateType?: string) {
        if (!isString(name)) { throw new Error('Name required (target form element name/source property name)'); }
        this.name = name;
        this.validators = [];
        let type = isString(updateType) ? updateType : 'valuechanged';
        this.setUpdateType(type);
    }

    setUpdateType(updateType: string) {
        if (!isString(updateType)) { throw new Error('Update type required'); }
        if (!isValidUpdateType(updateType)) { throw new Error('Invalid update type (valuechanged|lostfocus)'); }
        this.updateType = updateType;
        return this;
    }

    addValidator(validator: Validator) {
        this.validators.push(validator);
        return this;
    }
}




