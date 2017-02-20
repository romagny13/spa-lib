import { isDefined, isString, isNumber, isBoolean, isArray } from '../util';
import { Observable } from '../observables';
import { FormConfig } from './form.config';
import { FormElementConfig } from './form-element.config';
import { FormElementError } from './form.error';
import { FormSubmittedResponse } from './form.submitted.response';
import { FormElementBinding, SimpleFormElement, FormElementWithSource, FormElementWithArray } from './form.element';
import {
    findForm,
    isBindableElement,
    getEventNames,
    getBindedName,
    getElementValue,
    convertHtmlValueToObjectValue,
    setHtmlElementValue,
    validateValue,
    setElementInError,
    resetElementState,
    updateElementState
} from './util';

export class FormBinding {
    _subscribers: Function[];
    _stateSubscribers: Function[];
    _bindings: any[];
    source: any; // object
    form: any; // target form
    formConfig: FormConfig;
    validationType: string;
    submitted: boolean;
    constructor(selectorOrForm: any, source: any, formConfig?: FormConfig) {
        this._subscribers = [];
        this._stateSubscribers = [];
        this._bindings = [];
        this.submitted = false;
        // form
        let form = findForm(selectorOrForm);
        if (!form) { throw new Error('No element found for the form'); }
        this.form = form;
        // source
        this.source = source;
        // form config
        this.formConfig = isDefined(formConfig) ? formConfig : new FormConfig();
        this.validationType = formConfig.validationType;

        this._bind(form, source, this.formConfig);
        this._bindSubmit(form, source, this.formConfig);
    }

    get canValidate(): boolean {
        return (this.submitted || this.validationType === 'valuechanged');
    }

    _bind(form: HTMLFormElement, source: any, formConfig: FormConfig) {
        for (let i = 0; i < form.elements.length; i++) {
            let element: any = form.elements[i];
            if (element.type !== 'submit') {
                // find binding
                let isEditableElement = isBindableElement(element);
                let bindedName = getBindedName(element);

                if (isEditableElement && bindedName) {
                    let formElementConfig = formConfig.getFormElementConfig(bindedName);
                    // source property ?
                    if (source && source.hasOwnProperty(bindedName)) {
                        let sourceValue = source[bindedName];
                        let type = typeof sourceValue;
                        // source value with no validations => create default config
                        if (!formElementConfig) {
                            formElementConfig = new FormElementConfig(bindedName);
                            formConfig.addFormElementConfig(formElementConfig);
                        }
                        if (type === 'string' || type === 'number' || type === 'boolean') {
                            let binding = new FormElementWithSource(this, element, bindedName, formElementConfig, formConfig, source, sourceValue, type);
                            binding.onStateChanged((element, errors) => {
                                this._raiseStateChanged(element, errors);
                            });
                            this._bindings.push(binding);
                        }
                        else if (isArray(sourceValue)) {
                            // object/array
                            let binding = new FormElementWithArray(this, element, bindedName, formElementConfig, formConfig, source, sourceValue);
                            binding.onStateChanged((element, errors) => {
                                this._raiseStateChanged(element, errors);
                            });
                            this._bindings.push(binding);
                        }
                    }
                    else if (FormElementConfig) {
                        let binding = new SimpleFormElement(this, element, bindedName, formElementConfig, formConfig);
                        binding.onStateChanged((element, errors) => {
                            this._raiseStateChanged(element, errors);
                        });
                        this._bindings.push(binding);
                    }
                }
            }
        }
    }

    _validateAll(form: HTMLFormElement, source: any, formConfig: FormConfig) {
        let hasError = false,
            allErrors = [],
            validated = {};

        this._bindings.forEach((binding) => {
            if (!validated.hasOwnProperty(binding.bindedName)) {
                let value = binding instanceof FormElementWithSource ? binding.sourceValue : binding.value;
                let errors = binding.validate();
                if (errors.length > 0) {
                    hasError = true;
                    allErrors.push(new FormElementError(binding.element, errors[0], value));
                }
                updateElementState(binding.element, errors, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                validated[binding.bindedName] = 'validated';
            }
        });
        this.submitted = true;
        const formResponse = new FormSubmittedResponse(hasError, allErrors, this.form, this.source);
        this._raise(formResponse);
    }

    _bindSubmit(form: HTMLFormElement, source: any, formConfig: FormConfig) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._validateAll(form, source, formConfig);
        });
    }

    _raise(response: FormSubmittedResponse) {
        this._subscribers.forEach((subscriber) => {
            subscriber(response);
        });
    }

    _raiseStateChanged(element, errors) {
        this._validateAll(this.form, this.source, this.formConfig);
        this._stateSubscribers.forEach((stateSubscriber) => {
            stateSubscriber(element, errors);
        });
    }

    onStateChanged(stateSubscriber: Function) {
        this._stateSubscribers.push(stateSubscriber);
    }

    onSubmit(subscriber: Function) {
        this._subscribers.push(subscriber);
    }
}

