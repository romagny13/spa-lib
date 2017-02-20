import { assert } from 'chai';
import {
    RequiredValidator,
    MinLengthValidator,
    MaxLengthValidator,
    PatternValidator,
    CustomValidator,
    validateValue,
    convertHtmlValueToObjectValue
} from '../../../src/form/index';


describe('Form', () => {

    describe('Validators', () => {
        it('required ko', () => {
            let validator = new RequiredValidator('Message');
            let result = validator.validate(undefined);
            assert.isFalse(result);
            assert.equal(validator.error, 'Message');
        });

        it('required ok', () => {
            let validator = new RequiredValidator('Message');
            let result = validator.validate('ok');
            assert.isTrue(result);
            assert.equal(validator.error, undefined);
        });

        it('minlength ko', () => {
            let validator = new MinLengthValidator(3, 'Message');
            let result = validator.validate('aa');
            assert.isFalse(result);
            assert.equal(validator.error, 'Message');
        });

        it('minlength ok', () => {
            let validator = new MinLengthValidator(3, 'Message');
            let result = validator.validate('aaaa');
            assert.isTrue(result);
            assert.equal(validator.error, undefined);
        });

        it('maxlength ko', () => {
            let validator = new MaxLengthValidator(5, 'Message');
            let result = validator.validate('aaaaaaaa');
            assert.isFalse(result);
            assert.equal(validator.error, 'Message');
        });

        it('maxlength ok', () => {
            let validator = new MaxLengthValidator(5, 'Message');
            let result = validator.validate('aaa');
            assert.isTrue(result);
            assert.equal(validator.error, undefined);
        });

        it('pattern ko', () => {
            let validator = new PatternValidator(/^[a-z]+$/, 'Message');
            let result = validator.validate(1000);
            assert.isFalse(result);
            assert.equal(validator.error, 'Message');
        });

        it('pattern ok', () => {
            let validator = new PatternValidator(/^[a-z]+$/, 'Message');
            let result = validator.validate('aaaa');
            assert.isTrue(result);
            assert.equal(validator.error, undefined);
        });

        it('custom ko', () => {
            let validator = new CustomValidator((p) => {
                return p === 'a'; // ok if p === 'a'
            }, 'Message');
            let result = validator.validate('b');
            assert.isFalse(result);
            assert.equal(validator.error, 'Message');
        });

        it('custom ok', () => {
            let validator = new CustomValidator((p) => {
                return p === 'a';
            }, 'Message');
            let result = validator.validate('a');
            assert.isTrue(result);
            assert.equal(validator.error, undefined);
        });
    });

    describe('FormElements', () => {
        it('Should required undefined', () => {
            let validators = [new RequiredValidator(), new MinLengthValidator(3), new MaxLengthValidator(10)];
            let result = validateValue(undefined, validators);
            assert.isTrue(result.length > 0);
            assert.equal(result[0], 'This field is required.');
        });

        it('Should required null', () => {
            let validators = [new RequiredValidator(), new MinLengthValidator(3), new MaxLengthValidator(10)];
            let result = validateValue(null, validators);
            assert.isTrue(result.length > 0);
            assert.equal(result[0], 'This field is required.');
        });

        it('Should required string empty', () => {
            let validators = [new RequiredValidator(), new MinLengthValidator(3), new MaxLengthValidator(10)];
            let result = validateValue('', validators);
            assert.isTrue(result.length > 0);
            assert.equal(result[0], 'This field is required.');
        });

        it('Should required boolean false', () => {
            let validators = [new RequiredValidator(), new MinLengthValidator(3), new MaxLengthValidator(10)];
            let result = validateValue(false, validators);
            assert.isTrue(result.length > 0);
            assert.equal(result[0], 'This field is required.');
        });

        it('Should minlength', () => {
            let validators = [new RequiredValidator(), new MinLengthValidator(3, 'Error message'), new MaxLengthValidator(10)];
            let result = validateValue('ab', validators);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'Error message');
        });

        it('Should pass without required if string empty', () => {
            let validators = [new MaxLengthValidator(30, 'Error message'), new MaxLengthValidator(10)];
            let result = validateValue('', validators);
            assert.equal(result.length, 0);
        });

        it('Should pass validation', () => {
            let validators = [new RequiredValidator(), new MinLengthValidator(3, 'Error message'), new MaxLengthValidator(10)];
            let result = validateValue('its ok', validators);
            assert.equal(result.length, 0);
        });

        it('Should pattern', () => {
            let validators = [new RequiredValidator(), new PatternValidator(/^[a-z]+$/, 'Invalid value')];
            let result = validateValue(120, validators);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'Invalid value');
        });

        it('Should pass pattern', () => {
            let validators = [new RequiredValidator(), new PatternValidator(/^[a-z]+$/, 'Invalid value')];
            let result = validateValue('thisgood', validators);
            assert.equal(result.length, 0);
        });

        it('Should convert number', () => {
            let result = convertHtmlValueToObjectValue('number', '123');
            assert.equal(result, 123);
        });

        it('Should convert boolean', () => {
            let result = convertHtmlValueToObjectValue('boolean', 'true');
            assert.equal(result, true);
        });
    });


});
