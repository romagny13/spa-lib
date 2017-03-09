import { isUndefined, isDefined, isString, isNumber, isBoolean } from '../util';

export abstract class Validator {
    error: string;
    message: string;

    static required(message?: string) {
        return new RequiredValidator(message);
    }
    static minLength(minLength?: number, message?: string) {
        return new MinLengthValidator(minLength, message);
    }
    static maxLength(maxLength?: number, message?: string) {
        return new MaxLengthValidator(maxLength, message);
    }
    static pattern(pattern: any, message?: string) {
        return new PatternValidator(pattern, message);
    }
    static custom(fn: Function, message?: string) {
        return new CustomValidator(fn, message);
    }

    abstract validate(value: any): boolean;
}

export class RequiredValidator extends Validator {
    constructor(message?: string) {
        super();
        this.message = isString(message) ? message : 'This field is required.';
    }

    validate(value) {
        if (value === null || isUndefined(value) || value === '' || (isBoolean(value) && value === false)) {
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    }
}

export function formatMessage(message: string, searchValue, replaceValue) {
    return message.replace(searchValue, replaceValue);
}

export class MinLengthValidator extends Validator {
    minLength: number;
    constructor(minLength?: number, message?: string) {
        super();
        this.minLength = isNumber(minLength) ? minLength : 3;
        this.message = isString(message) ? message : formatMessage('Please enter at least than {0} characters.', '{0}', minLength);
    }

    validate(value) {
        if (value && value.length < this.minLength) {
            // error
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    }
}

export class MaxLengthValidator extends Validator {
    maxLength: number;
    constructor(maxLength?: number, message?: string) {
        super();
        this.maxLength = isNumber(maxLength) ? maxLength : 30;
        this.message = isString(message) ? message : formatMessage('Please enter no more than {0} characters.', '{0}', maxLength);
    }

    validate(value) {
        if (value && value.length > this.maxLength) {
            // error
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    }
}

export class PatternValidator extends Validator {
    pattern: any;
    constructor(pattern: any, message?: string) {
        super();
        this.pattern = pattern;
        this.message = isString(message) ? message : 'Please fix this field.';
    }
    validate(value) {
        if (isDefined(value) && !this.pattern.test(value)) {
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    }
}

export class CustomValidator extends Validator {
    fn: Function;
    constructor(fn: Function, message?: string) {
        super();
        this.fn = fn;
        this.message = isString(message) ? message : 'Please fix this field.';
    }
    validate(value) {
        if (!this.fn(value)) {
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    }
}
