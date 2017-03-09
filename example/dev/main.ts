import { FormConfig } from '../../src/form/form.config';
import {
    CustomValidator,
    MinLengthValidator,
    PatternValidator,
    RequiredValidator,
    Validator
} from '../../src/form/validators';
import { FormElementConfig } from '../../src/form/form-element.config';
import { isArray } from '../../src/util';
import { FormBinding } from '../../src/form/form';
import { FormSubmittedResponse } from '../../src/form/form.submitted.response';
import { FormElementError } from '../../src/form/form.error';

// model
let user = {
    firstname: 'marie',
    lastname: 'bellin',
    email: '',
    age: 20,
    list: '2',
    preference: 'b',
    likes: ['Milk', 'Cakes']
};

// form config
// const formConfig = new FormConfig('valuechanged', false, false, false)
const formConfig = new FormConfig()
    .addFormElementConfig('firstname', [Validator.required(), Validator.minLength(3)])
    .addFormElementConfig('lastname', [Validator.maxLength(10)])
    .addFormElementConfig('email', [Validator.pattern(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, 'Please enter a valid email.')])
    .addFormElementConfig('age', [Validator.custom((value) => {
        return value > 0 && value < 120;
    }, 'Oops ??')])
    .addFormElementConfig('agree', [Validator.required()])
    .addFormElementConfig('likes', [Validator.custom(() => {
        return user.likes.length > 0;
    }, 'Please select one or more items.')]);

// form binding
const formBinding = new FormBinding('#myform', user, formConfig);
const sumary: any = document.querySelector('.sumary');

formBinding.onStateChanged((element, errors) => {
    console.log('State changed', element, errors);
});

formBinding.onSubmit((response: FormSubmittedResponse) => {
    sumary.innerHTML = '';
    sumary.style.display = 'block';
    console.log('Submitted/refreshed', response);
    if (response.hasError) {
        response.errors.forEach((error: FormElementError) => {
            let p = document.createElement('p');
            p.innerHTML = error.message;
            sumary.appendChild(p);
        });
    }
    else {
        let json = JSON.stringify(response.source);
        sumary.innerHTML = `
            <h2>Ok (refresh on validation state changed)</h2>
            <pre>${json}</pre>
        `;
    }
});

// for debug
window['user'] = user;
console.log(formBinding);
