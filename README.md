# SpaLib

[![Build Status](https://travis-ci.org/romagny13/spa-lib.svg?branch=master)](https://travis-ci.org/romagny13/spa-lib)

```
npm i spa-lib -S
```

- Storage (local, session, cookies and indexedDB services)
- Cache
- Messenger
- Observable and ObservableArray
- Form binding and validation
- Http (with interceptors)
- OAuth (Google, Facebook, ...easy to extend)
- TypeScript Promise polyfill


## Imports

Example
```js
import { Observable, TSPromise  } from 'spa-lib';
// or
import * as SpaLib from 'spa-lib';
```

## es5

```html
 <script src="node_modules/spa-lib/dist/spa.lib.js"></script>
```

Example
```js
var messenger = new SpaLib.Messenger();
```

## Observables

- Observe value changes
```js
const vm = {
    title: 'My title'
};

// observe an object's property
let observable = new Observable(vm, 'title');
observable.subscribe((value) => {

});

vm.title = 'My new title'; // => valuechanged
```

- Observe array changes
```js
let items = ['a', 'b'];
let observableArray = new ObservableArray(items);
observableArray.subscribe((event, value, index) => {
    switch (event) {
        case 'added':

            break;
        case 'removed':

            break;
        case 'filtered':

            break;
        case 'sorted':

            break;
    }
});
// example with push
items.push('c', 'd', 'e');
```

Support :
- push
- unshift
- splice
- shift
- pop
- sort
- filter
- resetFilter

### Shorthands

```js
const vm = {
    title: 'My title'
};

observe(vm, 'title', (value) => {

});
```

```js
let items = ['a', 'b'];

observeArray(items, (event, value, index) => {

});
```

## Form binding and validation

```js
// model
let user = {
    firstname: 'marie',
    lastname: 'bellin',
    email: '',
    age: 20,
    list: '2',
    preference: 'b', 
    likes: ['Milk', 'Cakes'] // binding on array
};

// form config (validation on 'submit' by default or 'valuechanged')
const formConfig = new FormConfig()
    // form element name, validators array, updateType? ('valuechanged' by default or 'lostfocus')
    .addFormElementConfig('firstname', [Validator.required(), Validator.minLength(3)])
    .addFormElementConfig('lastname', [Validator.maxLength(10)])
    .addFormElementConfig('email', [Validator.pattern(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, 'Please enter a valid email.')])
    .addFormElementConfig('age', [Validator.custom((value) => {
        return value > 0 && value < 120;
    }, 'Oops ??')])
    .addFormElementConfig('agree', [Validator.required()]) // validation with an element not in the model (checkbox for example)
    .addFormElementConfig('likes', [Validator.custom(() => {
        return user.likes.length > 0;
    }, 'Please select one or more items.')]);

// form binding
const formBinding = new FormBinding('#myform', user, formConfig);
```
Note: validation messages are appended to html element on error with css class 'has-error' or 'has-success' (could be desabled with form config).

on validation state changed
```js
formBinding.onStateChanged((element, errors) => {
    console.log('State changed', element, errors);
});
```

on submit (create a sumary for example)
```js
const sumary: any = document.querySelector('.sumary');
formBinding.onSubmit((response: FormSubmittedResponse) => {
    sumary.innerHTML = '';
    sumary.style.display = 'block';
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
```

Allow to bind and validate with a simple form (cons: actually interact with the DOM)

```html
<form id="myform" class="form-horizontal">
    <div class="form-group">
        <label class="control-label" for="firstname">Firstname:</label>
        <input class="form-control" type="text" id="firstname" name="firstname" />
    </div>

    <div class="form-group">
        <label class="control-label" for="lastname">Lastname:</label>
        <input class="form-control" type="text" id="lastname" name="lastname" />
    </div>

    <div class="form-group">
        <label class="control-label" for="email">Email:</label>
        <input class="form-control" type="text" id="email" name="email" />
    </div>

    <div class="form-group">
        <label class="control-label" for="age">Age:</label>
        <input class="form-control" type="number" id="age" name="age" />
    </div>

    <div class="form-group">
        <label class="control-label" for="list">List (no validation):</label>
        <select class="form-control" name="list">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                </select>
    </div>

    <div class="form-group">
        <h3>Preference</h3>
        <input type="radio" name="preference" value="a">A<br>
        <input type="radio" name="preference" value="b">B<br>
        <input type="radio" name="preference" value="c">C
    </div>

    <div class="form-group">
        <h3>Like (multiple choice)</h3>
        <input type="checkbox" name="likes" value="Cakes">Cakes<br>
        <input type="checkbox" name="likes" value="Milk">Milk<br>
        <input type="checkbox" name="likes" value="Nutella">Nutella
    </div>
    <br/>
    <div class="checkbox"> <label><input type="checkbox" name="agree">Agree to conditions</label></div>
    <input class="btn btn-default" type="submit" value="Submit" />
</form>
```

## Messenger

```js
let messenger = new Messenger();
// subscribe (one or more arguments)
messenger.subscribe('MyEvent', (result1, result2, result3) => {

});

// publish 
messenger.publish('MyEvent', 'my string', 10, { name: 'my object result' });
```

## Http

### Send a request (GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH)
```js
const baseUrl = 'http://jsonplaceholder.typicode.com';
const http = new Http();
const request = new HttpRequest({ url: `${baseUrl}/posts` });
http.send(request).then((response: HttpResponse) => {
    let posts = JSON.parse(response.body);
});
```
- Post JSON 
```js
const data = {
    title: 'My post',
    body: 'My content'
};
http.post(`${baseUrl}/posts`, JSON.stringify(data)).then((response: HttpResponse) => {
    let post = JSON.parse(response.body);
});
```

- Post form
```js
let body = 'title=' + encodeURIComponent('My post') + '&content=' + encodeURIComponent('My content');
const request = new HttpRequest({
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    url: `${baseUrl}/posts`,
    body
});
http.send(request).then((response: HttpResponse) => {
    let post = JSON.parse(response.body);
});
```

- FormData
```js
let data = new FormData();
data.append('id', '101');
data.append('title', 'My post');
data.append('content', 'My content');

const request = new HttpRequest({
    method: 'POST',
    url: `${baseUrl}/posts`,
    body: data
});
http.send(request).then((response: HttpResponse) => {
    let post = JSON.parse(response.body);
});
```

- Set a timeout (milliseconds)
```js
const request = new HttpRequest({
    url: `${baseUrl}/posts`,
    timeout: 1000
});
http.send(request).then(() => {

}, (response: HttpResponse) => {
    // handle : 
    // - response with error status code 
    // - xhr error | timeout | abort
});
```

- Abort a request
```js
const request = new HttpRequest({ url: `${baseUrl}/posts`});
http.send(request).then(() => { }, (response) => {});
request.abort();
```
- Handle progress
```js

const request = new HttpRequest({
    url: `${baseUrl}/posts`,
    progress: (event) => {
        // ...
    }
});
http.send(request).then(() => {});
```
- Response type => blob
```js
const request = new HttpRequest({ url: 'http://res.cloudinary.com/romagny13/image/upload/v1464052663/dotnet_oh0ryu.png', responseType: 'blob' });
http.send(request).then((response: HttpResponse) => {

});
```

### REST Shorthands (get,post,put,delete)
```js
const data = {
    title: 'My post',
    body: 'lorem ipsum ...'
};
http.post(`${baseUrl}/posts`, JSON.stringify(data)).then((response: HttpResponse) => {

});
```
- put 
```js
const data = {
    id: 1,
    title: 'My updated post',
    content: 'My updated content'
};
http.put(`${baseUrl}/posts/1`, JSON.stringify(data)).then((response: HttpResponse) => {
    let post = JSON.parse(response.body);
});
```
- delete
```js
http.delete(`${baseUrl}/posts/1`).then((response: HttpResponse) => {

});
```

- With an access_token
```js
let access_token = 'ya29.CjCmA3KKBZH7ElidD3j_peoQaPdy2G099Ek6DYuYRfwFqSMXpR3i2_2xSjjHBo6FNNo';
http.get(`${baseUrl}/posts`, access_token).then((response: HttpResponse) => {});
```

### Interceptors

Create an interceptor
```js
http.interceptors.push({
    before(request: HttpRequest, next: Function) {

        next(true); // cancel if false
    },
    after(response: HttpResponse, next: Function) {
        
        next(true);
    }
});
```

### Load
```js
http.load('http://localhost/blog/mytemplate.html', (template) => {

});
```

## OAuth

<a href="https://github.com/romagny13/spa-lib/tree/master/example/oauth">Look at the OAuth example</a>

## TSPromise

<a href="https://github.com/romagny13/ts-promise">Documentation</a>

## Cache 

```js
// create a cache
const cache = new Cache();
let k = 'mykey';
let item = { name: 'my value' };
// store
cache.store(k, item);
// check
let hasItem = cache.has(k);
// get
let result = cache.retrieve(k);
// save to local storage
let storageKey = '__cache';
cache.save(storageKey);
// restore cache from local storage
cache.restore(storageKey);
// remove an item by key
cache.remove(k);
// clear
cache.clear();
```

## Storage

### Cookies
```js
const cookieService = new CookieService();
let name = 'mycookie';
// create a cookie
cookieService.set(name, value, 10);
// check
let hasCookie = cookieService.has(name)
// get
let result = cookieService.get(name);
// delete
let result = cookieService.delete(name);
// clear all cookies
cookieService.clear();
```

### Local and session storage

```js
let localService = new StorageService();

let key = 'mykey';
// set
localService.set(key, 'my value'); // value could be an object
// check
let hasItem = localService.has(key)
// get
let item = localService.get(key);
// remove
localService.remove(key);
// clear
localService.clear();
```

```js
let sessionService = new StorageService('session');

let key = 'mykey';
// set
sessionService.set(key, 'my value'); // value could be an object
// check
let hasItem = sessionService.has(key)
// get
let item = sessionService.get(key);
// remove
sessionService.remove(key);
// clear
sessionService.clear();
```

### indexedDB

<a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB">MDN</a>

```js
const dbConfigs = [{
    name: 'testdb', // db name
    created: true, // add created and modified fields
    // object stores
    objectStores: [{
        name: 'users',
        key: { keyPath: 'id', autoIncrement: true }, // key
        indexes: [{ name: 'username', definition: { unique: false } }] // indexes
    }]
}];
const indexeddbService = new IndexedDBService(dbConfigs);
// open /create / update the db (if db version is updated)
indexeddbService.openCreateDb('testdb', 1).then((result) => {
 
 // then could get, insert, update,... data

}, (error) => {

});
```
- Insert
```js
indexeddbService.insert('users', { userName: 'marie' }).then((result) => {

});
```

- get all

```js
indexeddbService.getAll('users').then((result: any[]) => {

});
```
- get one

```js
// object store and key
indexeddbService.getOne('users', 1).then((result) => {

};
```

- update
```js
let user = {
    userName: 'updated'
};
indexeddbService.update('users', 1, user).then((result) => {

});
```

- delete
```js
indexeddbService.delete('users', 1).then((result) => {

});
```



