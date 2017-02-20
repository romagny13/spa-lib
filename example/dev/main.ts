import {
    FormBinding,
    FormSubmittedResponse,
    FormElementError,
    FormConfig,
    FormElementConfig,
    RequiredValidator,
    MinLengthValidator,
    MaxLengthValidator,
    PatternValidator,
    CustomValidator
} from '../../src/main';


let firstNameConfig = new FormElementConfig('firstname');
firstNameConfig
    .addValidator(new RequiredValidator())
    .addValidator(new MinLengthValidator(3));

let lastNameConfig = new FormElementConfig('lastname');
lastNameConfig
    /*.addValidator(new RequiredValidator())*/
    .addValidator(new MaxLengthValidator(5));

let emailConfig = new FormElementConfig('email');
emailConfig.addValidator(new PatternValidator(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, 'Please enter a valid email.'));

let ageConfig = new FormElementConfig('age');
ageConfig.addValidator(new CustomValidator((value) => {
    return value > 0 && value < 120;
}, 'Oops ??'));

let agreeConfig = new FormElementConfig('agree');
agreeConfig.addValidator(new RequiredValidator());

let likesConfig = new FormElementConfig('likes');
likesConfig.addValidator(new CustomValidator(() => {
    return user.likes.length > 0;
}, 'Please select one or more items.'));

const formConfig = new FormConfig()
    .addFormElementConfig(firstNameConfig)
    .addFormElementConfig(lastNameConfig)
    .addFormElementConfig(emailConfig)
    .addFormElementConfig(ageConfig)
    .addFormElementConfig(agreeConfig)
    .addFormElementConfig(likesConfig);

let user = {
    firstname: 'marie',
    lastname: 'bellin',
    email: '',
    age: 20,
    list: '2',
    preference: 'b',
    likes: ['Milk', 'Cakes']
};

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

