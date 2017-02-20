import { isDefined, isString, isNumber, isBoolean } from '../util';
import { FormBinding } from './form';
import { FormConfig } from './form.config';
import { FormElementConfig } from './form-element.config';
import {
    bindHtmlElement,
    convertHtmlValueToObjectValue,
    bindObservableToElement,
    bindObservableArrayToElement,
    validateValue,
    updateElementState,
    setHtmlElementValue,
    getElementValue,
    getElementType,
    ElementType,
    setValues
} from './util';

export abstract class FormElementBinding {
    _subscribers: Function[];
    _elementType: ElementType;
    hasError: boolean;
    errors: string[];
    firstError: string;

    constructor(public formBinding: FormBinding,
        public element: any,
        public bindedName: string,
        public formElementConfig: FormElementConfig,
        public formConfig: FormConfig) {
        this._subscribers = [];
        this._elementType = getElementType(element);
    }

    _raiseStateChanged(element, errors) {
        this._subscribers.forEach((subscriber) => {
            subscriber(element, errors);
        });
    }

    _checkState(errors, next) {
        let error = errors[0];
        let hasError = isString(error);
        if (this.hasError !== hasError || this.firstError !== error) {
            // state changed
            this.hasError = hasError;
            this.firstError = error;
            this.errors = errors;
            this._raiseStateChanged(this.element, errors);
            next();
        }
    }

    onStateChanged(stateSubscriber: Function) {
        this._subscribers.push(stateSubscriber);
    }

    abstract validate(): string[];
}

export class FormElementWithSource extends FormElementBinding {
    source: any;
    sourceValue: any;
    type: string;
    constructor(formBinding: FormBinding,
        element, bindedName,
        formElementConfig: FormElementConfig,
        formConfig: FormConfig,
        source: any,
        initialValue: any,
        type: string) {
        super(formBinding, element, bindedName, formElementConfig, formConfig);
        this.source = source;
        this.sourceValue = initialValue;
        this.type = type;

        this._bind(this.element, this._elementType, this.source, this.bindedName, this.sourceValue, this.type, this.formElementConfig, this.formConfig);
    }

    _bind(element, elementType, source, bindedName, initialValue, type, formElementConfig: FormElementConfig, formConfig: FormConfig) {
        let canValidate;
        // html => obj
        bindHtmlElement(element, elementType, formElementConfig.updateType, (event) => {
            let targetValue = type === 'boolean' ? event.target.checked : convertHtmlValueToObjectValue(type, event.target.value);
            source[bindedName] = targetValue;
        });

        // obj => html
        bindObservableToElement(source, bindedName, element, elementType, (newValue) => {
            if (canValidate || this.formBinding.canValidate) {
                let errors = validateValue(newValue, formElementConfig.validators);
                this._checkState(errors, () => {
                    updateElementState(element, errors, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                });
                canValidate = true;
            }
        });
        // initialvalue
        setHtmlElementValue(element, type, initialValue, elementType);
    }

    validate() {
        let value = this.source[this.bindedName];
        this.errors = validateValue(value, this.formElementConfig.validators);
        this.hasError = this.errors.length > 0;
        return this.errors;
    }

}

export class FormElementWithArray extends FormElementBinding {
    source: any;
    sourceValue: any[];
    type: string; // array of string | number | boolean
    constructor(formBinding: FormBinding,
        element, bindedName,
        formElementConfig: FormElementConfig,
        formConfig: FormConfig,
        source: any,
        array: any) {
        super(formBinding, element, bindedName, formElementConfig, formConfig);
        this.source = source;
        this.sourceValue = array;
        this.type = array[0] ? typeof array[0] : 'string';

        this._bind(this.element, this._elementType, this.sourceValue, this.type, this.formElementConfig, this.formConfig);
    }

    _bind(element, elementType, array: any[], type, formElementConfig: FormElementConfig, formConfig: FormConfig) {
        let canValidate;
        // html => obj
        bindHtmlElement(element, elementType, formElementConfig.updateType, (event) => {
            let targetValue = type === 'boolean' ? event.target.checked : convertHtmlValueToObjectValue(type, event.target.value);
            let index = array.indexOf(targetValue);
            if (index === -1) {
                array.push(targetValue);
            }
            else {
                array.splice(index, 1);
            }
        });

        // obj => html
        bindObservableArrayToElement(array, element, elementType, (event, newValue, index) => {
            setValues(array, type, element, elementType);
            if (canValidate || this.formBinding.canValidate) {
                let errors = validateValue(newValue, formElementConfig.validators);
                this._checkState(errors, () => {
                    updateElementState(element, errors, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                });
                canValidate = true;
            }
        });

        setValues(array, type, element, elementType);
    }

    validate() {
        let value = this.source[this.bindedName];
        this.errors = validateValue(value, this.formElementConfig.validators);
        this.hasError = this.errors.length > 0;
        return this.errors;
    }

}

export class SimpleFormElement extends FormElementBinding {
    value: any;
    constructor(formBinding: FormBinding, element, bindedName, formElementConfig: FormElementConfig, formConfig: FormConfig) {
        super(formBinding, element, bindedName, formElementConfig, formConfig);
        this._bind(this.element, this._elementType, this.formElementConfig, this.formConfig);
    }

    _bind(element, elementType, formElementConfig: FormElementConfig, formConfig: FormConfig) {
        let canValidate;
        bindHtmlElement(element, elementType, formElementConfig.updateType, (event) => {
            if (canValidate || this.formBinding.canValidate) {
                let newValue = getElementValue(element, this._elementType);
                this.value = newValue;
                let errors = validateValue(newValue, formElementConfig.validators);
                this._checkState(errors, () => {
                    updateElementState(element, errors, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                });
                canValidate = true;
            }
        });
    }

    validate() {
        let value = getElementValue(this.element, this._elementType);
        this.value = value;
        this.errors = validateValue(value, this.formElementConfig.validators);
        this.hasError = this.errors.length > 0;
        return this.errors;
    }
}