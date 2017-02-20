import { isUndefined, isDefined, isString, isNumber, isBoolean, isObject } from '../util';
import { Validator } from './validators';
import { Observable, ObservableArray } from '../observables';

export function isHTMLFormELement(value: any): boolean {
    return value instanceof HTMLFormElement;
}

export function isValidUpdateType(value: string): boolean {
    let test = value.toLocaleLowerCase();
    return test === 'lostfocus' || test === 'valuechanged';
}

export function isValidValidationType(value: string): boolean {
    let test = value.toLocaleLowerCase();
    return test === 'submit' || test === 'valuechanged';
}

export enum ElementType {
    CheckBox,
    Radio,
    Input,
    Range,
    Select,
    TextArea,
    Other
}

export function findForm(selectorOrForm: any) {
    if (isString(selectorOrForm)) {
        return document.querySelector(selectorOrForm);
    }
    else if (isHTMLFormELement(selectorOrForm)) {
        return selectorOrForm;
    }
}

export function getElementType(element: any): ElementType {
    if (element.tagName === 'INPUT') {
        if (element.type === 'checkbox') {
            return ElementType.CheckBox;
        }
        else if (element.type === 'radio') {
            return ElementType.Radio;
        }
        if (element.type === 'range') {
            return ElementType.Range;
        }
        else {
            return ElementType.Input;
        }
    }
    else if (element.tagName === 'TEXTAREA') {
        return ElementType.TextArea;
    }
    else if (element.tagName === 'SELECT') {
        return ElementType.Select;
    }
    return ElementType.Other;
}

export function convertHtmlValueToObjectValue(sourceType, value) {
    if (sourceType === 'string') {
        return String(value);
    } else if (sourceType === 'number') {
        return Number(value);
    } else if (sourceType === 'boolean') {
        return Boolean(value);
    }
}

export function isBindableElement(element: any) {
    return (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT');
}

export function isKeyupableElement(elementType: ElementType) {
    return (elementType !== ElementType.CheckBox && elementType !== ElementType.Radio && elementType !== ElementType.Range);
}

export function getEventNames(element: any, elementType: ElementType, updateType?: string): string[] {
    if (isBindableElement(element)) {
        if (updateType === 'lostfocus') {
            return ['change'];
        }
        else {
            if (isKeyupableElement(elementType)) {
                return ['keyup', 'change'];
            }
            else {
                return ['change'];
            }
        }
    }
    return [];
}

export function setHtmlElementValue(element, sourceType, value, elementType: ElementType) {
    if (elementType === ElementType.Input || elementType === ElementType.TextArea) {
        element.value = value;
    }
    else if (elementType === ElementType.CheckBox) {
        if (sourceType === 'boolean') {
            element.checked = value;
        }
        else {
            element.checked = element.value === value;
        }
    }
    else if (elementType === ElementType.Radio) {
        element.checked = element.value === value;
    }
    else if (elementType === ElementType.Select) {
        const options = element.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === value) {
                element.selectedIndex = i;
                break;
            }
        }
    }
    else {
        element.innerHTML = value;
    }
}

export function getElementValue(element, elementType: ElementType) {
    if (elementType === ElementType.Input) {
        return element.value;
    }
    else if (elementType === ElementType.CheckBox || elementType === ElementType.Radio) {
        return element.checked;
    }
    else if (elementType === ElementType.Select) {
        return element.options[element.selectedIndex].value;
    }
    else if (elementType === ElementType.Range) {
        return element.value;
    }
    else if (elementType === ElementType.TextArea) {
        return element.value;
    }
}

export function setValues(array, type, element, elementType) {
    array.forEach((item) => {
        let value = type === 'boolean' ? element.checked : convertHtmlValueToObjectValue(type, element.value);
        if (value === item) {
            setHtmlElementValue(element, type, value, elementType);
        }
    });
}

export function setElementInError(element: any, errors: string[], showErrorMessages: boolean, cssClassOnSuccess: boolean, cssClassOnError: boolean) {
    if (showErrorMessages) {
        let span = element.parentNode.querySelector('.help-block');
        if (!span) {
            span = document.createElement('span');
            span.classList.add('help-block');
            element.parentNode.appendChild(span);
        }
        span.innerHTML = errors[0];
    }
    if (cssClassOnSuccess) {
        element.parentNode.classList.remove('has-success');
    }
    if (cssClassOnError) {
        element.parentNode.classList.add('has-error');
    }
}

export function resetElementState(element: any, showErrorMessages: boolean, cssClassOnSuccess: boolean, cssClassOnError: boolean) {
    if (showErrorMessages) {
        let span = element.parentNode.querySelector('.help-block');
        if (span) {
            element.parentNode.removeChild(span);
        }
    }
    if (cssClassOnSuccess) {
        element.parentNode.classList.remove('has-error');
    }
    if (cssClassOnError) {
        element.parentNode.classList.add('has-success');
    }
}

export function validateValue(value, validators: Validator[]) {
    let errors = [];
    validators.forEach((validator) => {
        if (!validator.validate(value)) {
            errors.push(validator.error);
        }
    });
    return errors;
}

export function getBindedName(element: any) {
    return element.getAttribute('name');
}

export function updateElementState(element, errors, showErrorMessages, cssClassOnSuccess, cssClassOnError) {
    if (errors.length > 0) {
        setElementInError(element, errors, showErrorMessages, cssClassOnSuccess, cssClassOnError);
    }
    else {
        resetElementState(element, showErrorMessages, cssClassOnSuccess, cssClassOnError);
    }
}

export function bindObservableToElement(source, property, element, elementType: ElementType, next) {
    let o = new Observable(source, property);
    let type = typeof source[property];
    o.subscribe((newValue) => {
        // update element value
        setHtmlElementValue(element, type, newValue, elementType);
        next(newValue);
    });
}

export function bindObservableArrayToElement(array, element, elementType: ElementType, next) {
    let o = new ObservableArray(array);
    o.subscribe((event, value, index) => {
        if (event === 'added' || event === 'removed') {
            next(event, value, index);
        }
    });
}

export function bindHtmlElement(element, elementType: ElementType, updateType, handler) {
    // on user edit form element
    let eventNames = getEventNames(element, elementType, updateType);
    eventNames.forEach((eventName) => {
        element.addEventListener(eventName, handler);
    });
}
