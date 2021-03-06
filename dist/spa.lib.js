/*!
 * SpaLib v0.1.3
 * (c) 2017 romagny13
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SpaLib = global.SpaLib || {})));
}(this, (function (exports) { 'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function isUndefined(value) { return typeof value === 'undefined'; }
function isDefined(value) { return typeof value !== 'undefined'; }
function isString(value) { return typeof value === 'string'; }
function isNumber(value) { return typeof value === 'number'; }
function isObject(value) { return value !== null && typeof value === 'object'; }
function isFunction(value) { return typeof value === 'function'; }
function isBoolean(value) { return typeof value === 'boolean'; }

var isArray = Array.isArray;

function getExpirationDateString(expiration) {
    var date = new Date();
    date.setTime(date.getTime() + (expiration * 24 * 60 * 60 * 1000));
    return date.toUTCString();
}
function tryGetObject(value) {
    try {
        var result = JSON.parse(value);
        return result;
    }
    catch (e) {
        return null;
    }
}
function supportStorage() {
    return typeof (Storage) !== undefined;
}
function getIndexedDB() {
    var w = window;
    return w.indexedDB || w.webkitIndexedDB || w.mozIndexedDB || w.msIndexedDB;
}

var CookieService = (function () {
    function CookieService() {
    }
    CookieService.prototype.set = function (name, value, expirationDays, path, domain, secure) {
        if (!isString(name))
            throw new Error('Name required');
        if (!isString(value))
            throw new Error('String value required');
        if (!isNumber(expirationDays)) {
            expirationDays = 30;
        }
        var newCookie = [];
        newCookie.push(name + '=' + encodeURIComponent(value));
        newCookie.push('expires=' + getExpirationDateString(expirationDays));
        if (isString(path)) {
            newCookie.push('path=' + path);
        }
        if (isString(domain)) {
            newCookie.push('domain=' + domain);
        }
        if (secure === true) {
            newCookie.push('secure');
        }
        // set cookie
        document.cookie = newCookie.join('; ');
    };
    CookieService.prototype.get = function (name) {
        if (!isString(name))
            throw new Error('Name required');
        var stored = document.cookie.split(';');
        for (var i = 0; i < stored.length; i++) {
            var nameAndValue = stored[i].split('=');
            if (nameAndValue[0].trim() === name) {
                return decodeURIComponent(nameAndValue[1].trim());
            }
        }
    };
    CookieService.prototype.has = function (name) {
        if (!isString(name))
            throw new Error('Name required');
        return this.get(name) !== undefined;
    };
    CookieService.prototype.delete = function (name) {
        if (this.has(name)) {
            this.set(name, '', -1);
            return true;
        }
        return false;
    };
    CookieService.prototype.clear = function () {
        var stored = document.cookie.split(';');
        for (var i = 0; i < stored.length; i++) {
            var name = stored[i].split('=')[0];
            this.set(name, '', -1);
        }
    };
    return CookieService;
}());

function handleFail(request, reject) {
    request.onerror = function (e) { reject(e); };
    request.onblocked = function (e) { reject(e); };
    request.onabort = function (e) { reject(e); };
}
var IndexedDBService = (function () {
    function IndexedDBService(dbConfigs) {
        this._indexedDB = getIndexedDB();
        this._dbConfigs = isDefined(dbConfigs) && dbConfigs || [];
    }
    IndexedDBService.prototype.getDbConfig = function (dbName) {
        return this._dbConfigs.find(function (c) { return c.name === dbName; });
    };
    IndexedDBService.prototype.openCreateDb = function (dbName, dbVersion) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var request = _this._indexedDB.open(dbName, dbVersion);
            handleFail(request, reject);
            // upgrade
            request.onupgradeneeded = function (e) {
                var db = e.target.result;
                var dbConfig = _this.getDbConfig(dbName);
                if (dbConfig && isArray(dbConfig.objectStores)) {
                    dbConfig.objectStores.forEach(function (objectStoreConfig) {
                        if (!db.objectStoreNames.contains(objectStoreConfig.name)) {
                            _this.createObjectStore(db, objectStoreConfig.name, objectStoreConfig.key, objectStoreConfig.indexes);
                        }
                    });
                }
            };
            request.onsuccess = function (e) {
                _this._currentDb = e.target.result;
                _this._currentDbName = dbName;
                _this._currentConfig = _this.getDbConfig(dbName);
                resolve(_this._currentDb);
            };
        });
    };
    IndexedDBService.prototype.closeDb = function () {
        if (this._currentDb && 'close' in this._currentDb) {
            this._currentDb.close();
        }
    };
    IndexedDBService.prototype.deleteDb = function (dbName) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._currentDbName === dbName) {
                _this.closeDb();
            }
            var request = _this._indexedDB.deleteDatabase(dbName);
            handleFail(request, reject);
            request.onsuccess = function (e) { resolve(e); };
        });
    };
    IndexedDBService.prototype.createObjectStore = function (db, objectStoreName, key, indexes) {
        var objectStore = db.createObjectStore(objectStoreName, key);
        if (indexes) {
            indexes.forEach(function (index) {
                var options = index.definition || { unique: false };
                objectStore.createIndex(index.name, index.key, options);
            });
        }
    };
    IndexedDBService.prototype.getObjectStore = function (objectStoreName, readMode, reject) {
        var transaction = this._currentDb.transaction([objectStoreName], readMode);
        if (reject) {
            handleFail(transaction, reject);
        }
        return transaction.objectStore(objectStoreName);
    };
    IndexedDBService.prototype.insert = function (objectStoreName, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._currentDb) {
                throw new Error('Require a connection opened');
            }
            if (_this._currentConfig && _this._currentConfig.created) {
                var date = Date.now();
                data.created = date;
                data.modified = date;
            }
            var store = _this.getObjectStore(objectStoreName, 'readwrite', reject);
            if (store) {
                var request = store.add(data); // add
                handleFail(request, reject);
                request.onsuccess = function (e) { resolve(e.target.result); };
            }
        });
    };
    IndexedDBService.prototype.update = function (objectStoreName, key, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._currentDb) {
                throw new Error('Require a connection opened');
            }
            var store = _this.getObjectStore(objectStoreName, 'readwrite', reject);
            var request = store.get(key); // get one
            handleFail(request, reject);
            request.onsuccess = function (e) {
                var original = e.target.result;
                if (original) {
                    if (_this._currentConfig && _this._currentConfig.created) {
                        data.modified = Date.now();
                    }
                    var updateRequest = store.put(data); // put
                    handleFail(updateRequest, reject);
                    updateRequest.onsuccess = function () { resolve(data); };
                }
            };
        });
    };
    IndexedDBService.prototype.delete = function (objectStoreName, key) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._currentDb) {
                throw new Error('Require a connection opened');
            }
            var store = _this.getObjectStore(objectStoreName, 'readwrite', reject);
            var request = store.delete(key); // delete
            handleFail(request, reject);
            request.onsuccess = function (e) { resolve(e); };
        });
    };
    IndexedDBService.prototype.count = function (objectStoreName) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._currentDb) {
                throw new Error('Require a connection opened');
            }
            var store = _this.getObjectStore(objectStoreName, 'readonly', reject);
            var request = store.count(); // count
            handleFail(request, reject);
            request.onsuccess = function (e) {
                resolve(e.target.result);
            };
        });
    };
    IndexedDBService.prototype.getAll = function (objectStoreName) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._currentDb) {
                throw new Error('Require a connection opened');
            }
            var data = [];
            var store = _this.getObjectStore(objectStoreName, 'readonly', reject);
            var countRequest = store.count();
            handleFail(countRequest, reject);
            countRequest.onsuccess = function (countEventArgs) {
                var totalCount = countEventArgs.target.result;
                var cursorRequest = store.openCursor(); // cursor
                handleFail(cursorRequest, reject);
                cursorRequest.onsuccess = function (cursorEventArgs) {
                    var result = cursorEventArgs.target.result;
                    if (result) {
                        var item = result.value;
                        data.push(item);
                        if (data.length === totalCount) {
                            resolve(data);
                        }
                        else {
                            result.continue();
                        }
                    }
                    else {
                        resolve(data);
                    }
                };
            };
        });
    };
    IndexedDBService.prototype.getOne = function (objectStoreName, key) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._currentDb) {
                throw new Error('Require a connection opened');
            }
            var store = _this.getObjectStore(objectStoreName, 'readonly', reject);
            var request = store.get(key); // get one
            handleFail(request, reject);
            request.onsuccess = function (e) { resolve(e.target.result); };
        });
    };
    return IndexedDBService;
}());

var StorageService = (function () {
    function StorageService(strategy) {
        this._strategy = isString(strategy) && /^(local|session)$/i.test(strategy) ? strategy : 'local';
        if (this._strategy === 'local') {
            this._storage = localStorage;
        }
        else {
            this._storage = sessionStorage;
        }
    }
    StorageService.prototype.set = function (key, value) {
        try {
            var data = isObject(value) ? JSON.stringify(value) : value;
            this._storage[key] = data;
        }
        catch (e) { }
    };
    StorageService.prototype.get = function (key) {
        var value = this._storage[key];
        var result = tryGetObject(value);
        if (result) {
            return result;
        }
        else {
            return value;
        }
    };
    StorageService.prototype.has = function (key) {
        return this._storage[key] !== undefined;
    };
    StorageService.prototype.remove = function (key) {
        if (this.has(key)) {
            this._storage.removeItem(key);
            return true;
        }
        return false;
    };
    StorageService.prototype.getValues = function () {
        var result = [];
        for (var i = 0; i < this._storage.length; i++) {
            var value = this.get(this._storage.key(i));
            result.push(value);
        }
        return result;
    };
    StorageService.prototype.getKeys = function () {
        return Object.keys(this._storage);
    };
    StorageService.prototype.clear = function () {
        this._storage.clear();
    };
    return StorageService;
}());

var Cache = (function () {
    var _container = {};
    var storageService = new StorageService();
    var Cache = (function () {
        function Cache() {
        }
        Object.defineProperty(Cache.prototype, "length", {
            get: function () {
                return Object.keys(_container).length;
            },
            enumerable: true,
            configurable: true
        });
        Cache.prototype.has = function (key) {
            return _container.hasOwnProperty(key);
        };
        Cache.prototype.store = function (key, value) {
            _container[key] = value;
        };
        Cache.prototype.retrieve = function (key) {
            if (this.has(key)) {
                return _container[key];
            }
        };
        Cache.prototype.remove = function (key) {
            if (this.has(key)) {
                delete _container[key];
                return true;
            }
            return false;
        };
        Cache.prototype.clear = function () {
            _container = {};
        };
        /**
        * save to local storage
        */
        Cache.prototype.save = function (key) {
            storageService.set(key, _container);
        };
        /**
        * restore from local storage
        */
        Cache.prototype.restore = function (key) {
            var cached = storageService.get(key);
            if (cached) {
                _container = cached;
                return true;
            }
            return false;
        };
        return Cache;
    }());
    return Cache;
})();

var Observable = (function () {
    function Observable(obj, name) {
        var initialValue = obj[name];
        var self = this;
        this._subscribers = [];
        function raise(value) {
            self._subscribers.forEach(function (subscriber) {
                subscriber(value);
            });
        }
        Object.defineProperty(obj, name, {
            get: function () {
                return initialValue;
            },
            set: function (value) {
                initialValue = value;
                raise(value);
            },
            enumerable: true,
            configurable: true
        });
    }
    Observable.prototype.subscribe = function (subscriber) {
        this._subscribers.push(subscriber);
    };
    Observable.prototype.unsubscribe = function (subscriber) {
        var index = this._subscribers.indexOf(subscriber);
        if (index !== -1) {
            this._subscribers.splice(index, 1);
            return true;
        }
        return false;
    };
    return Observable;
}());

var ObservableArray = (function () {
    function ObservableArray(array) {
        var self = this;
        function raise(type, value, index) {
            self._subscribers.forEach(function (subscriber) {
                subscriber(type, value, index);
            });
        }
        if (!isArray(array)) {
            throw new TypeError('Array required');
        }
        this._subscribers = [];
        this._array = array;
        // insert at the end of the array each argument
        array.push = function () {
            for (var i = 0; i < arguments.length; i++) {
                var item = arguments[i];
                var index = this.length;
                Array.prototype.push.call(this, item);
                raise('added', item, index);
            }
            return this.length;
        };
        // insert to the beginning each argument
        array.unshift = function () {
            for (var i = 0; i < arguments.length; i++) {
                var item = arguments[i];
                this.splice(i, 0, item);
            }
            return this.length;
        };
        // from start index, delete x items, then insert next arguments and return an array with all removed items
        array.splice = function (start, deleteCount) {
            var _this = this;
            var items = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                items[_i - 2] = arguments[_i];
            }
            if (!isNumber(start) || !isNumber(deleteCount)) {
                return [];
            }
            var removedItems = [];
            // remove
            var endIndex = start + deleteCount;
            for (var i = start; i < endIndex; i++) {
                // index always start because we removed an item
                var item = Array.prototype.splice.call(this, start, 1)[0];
                removedItems.push(item);
                raise('removed', item, i);
            }
            // insert
            items.forEach(function (item, i) {
                Array.prototype.splice.call(_this, start, 0, item);
                raise('added', item, i);
                start++;
            });
            return removedItems;
        };
        // remove and return the first item (inverse of pop)
        array.shift = function () {
            if (this.length > -1) {
                var item = Array.prototype.shift.call(this);
                raise('removed', item, 0);
                return item;
            }
        };
        // remove and return the last item
        array.pop = function () {
            var index = this.length - 1;
            if (index > -1) {
                var item = Array.prototype.pop.call(this);
                raise('removed', item, index);
                return item;
            }
        };
        array.sort = function (fn) {
            Array.prototype.sort.call(this, fn);
            raise('sorted', this, null);
            return this;
        };
        array.filter = function (fn) {
            var result = [];
            this.forEach(function (current) {
                if (fn(current) === true) {
                    result.push(current);
                }
            });
            raise('filtered', result, null);
            return result;
        };
        array['resetFilter'] = function () {
            raise('filtered', this, null);
            return this;
        };
    }
    ObservableArray.prototype.subscribe = function (subscriber) {
        this._subscribers.push(subscriber);
    };
    ObservableArray.prototype.unsubscribe = function (subscriber) {
        var index = this._subscribers.indexOf(subscriber);
        if (index !== -1) {
            this._subscribers.splice(index, 1);
            return true;
        }
        return false;
    };
    return ObservableArray;
}());

function isHTMLFormELement(value) {
    return value instanceof HTMLFormElement;
}
function isValidUpdateType(value) {
    var test = value.toLocaleLowerCase();
    return test === 'lostfocus' || test === 'valuechanged';
}
function isValidValidationType(value) {
    var test = value.toLocaleLowerCase();
    return test === 'submit' || test === 'valuechanged';
}
var ElementType;
(function (ElementType) {
    ElementType[ElementType["CheckBox"] = 0] = "CheckBox";
    ElementType[ElementType["Radio"] = 1] = "Radio";
    ElementType[ElementType["Input"] = 2] = "Input";
    ElementType[ElementType["Range"] = 3] = "Range";
    ElementType[ElementType["Select"] = 4] = "Select";
    ElementType[ElementType["TextArea"] = 5] = "TextArea";
    ElementType[ElementType["Other"] = 6] = "Other";
})(ElementType || (ElementType = {}));
function findForm(selectorOrForm) {
    if (isString(selectorOrForm)) {
        return document.querySelector(selectorOrForm);
    }
    else if (isHTMLFormELement(selectorOrForm)) {
        return selectorOrForm;
    }
}
function getElementType(element) {
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
function convertHtmlValueToObjectValue(sourceType, value) {
    if (sourceType === 'string') {
        return String(value);
    }
    else if (sourceType === 'number') {
        return Number(value);
    }
    else if (sourceType === 'boolean') {
        return Boolean(value);
    }
}
function isBindableElement(element) {
    return (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT');
}
function isKeyupableElement(elementType) {
    return (elementType !== ElementType.CheckBox && elementType !== ElementType.Radio && elementType !== ElementType.Range);
}
function getEventNames(element, elementType, updateType) {
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
function setHtmlElementValue(element, sourceType, value, elementType) {
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
        var options = element.options;
        for (var i = 0; i < options.length; i++) {
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
function getElementValue(element, elementType) {
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
function setValues(array, type, element, elementType) {
    array.forEach(function (item) {
        var value = type === 'boolean' ? element.checked : convertHtmlValueToObjectValue(type, element.value);
        if (value === item) {
            setHtmlElementValue(element, type, value, elementType);
        }
    });
}
function setElementInError(element, errors, showErrorMessages, cssClassOnSuccess, cssClassOnError) {
    if (showErrorMessages) {
        var span = element.parentNode.querySelector('.help-block');
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
function resetElementState(element, showErrorMessages, cssClassOnSuccess, cssClassOnError) {
    if (showErrorMessages) {
        var span = element.parentNode.querySelector('.help-block');
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
function validateValue(value, validators) {
    var errors = [];
    validators.forEach(function (validator) {
        if (!validator.validate(value)) {
            errors.push(validator.error);
        }
    });
    return errors;
}
function getBindedName(element) {
    return element.getAttribute('name');
}
function updateElementState(element, errors, showErrorMessages, cssClassOnSuccess, cssClassOnError) {
    if (errors.length > 0) {
        setElementInError(element, errors, showErrorMessages, cssClassOnSuccess, cssClassOnError);
    }
    else {
        resetElementState(element, showErrorMessages, cssClassOnSuccess, cssClassOnError);
    }
}
function bindObservableToElement(source, property, element, elementType, next) {
    var o = new Observable(source, property);
    var type = typeof source[property];
    o.subscribe(function (newValue) {
        // update element value
        setHtmlElementValue(element, type, newValue, elementType);
        next(newValue);
    });
}
function bindObservableArrayToElement(array, element, elementType, next) {
    var o = new ObservableArray(array);
    o.subscribe(function (event, value, index) {
        if (event === 'added' || event === 'removed') {
            next(event, value, index);
        }
    });
}
function bindHtmlElement(element, elementType, updateType, handler) {
    // on user edit form element
    var eventNames = getEventNames(element, elementType, updateType);
    eventNames.forEach(function (eventName) {
        element.addEventListener(eventName, handler);
    });
}

var FormElementConfig = (function () {
    function FormElementConfig(name, updateType) {
        if (!isString(name)) {
            throw new Error('Name required (target form element name/source property name)');
        }
        this.name = name;
        this.validators = [];
        var type = isString(updateType) ? updateType : 'valuechanged';
        this.setUpdateType(type);
    }
    FormElementConfig.prototype.setUpdateType = function (updateType) {
        if (!isString(updateType)) {
            throw new Error('Update type required');
        }
        if (!isValidUpdateType(updateType)) {
            throw new Error('Invalid update type (valuechanged|lostfocus)');
        }
        this.updateType = updateType;
        return this;
    };
    FormElementConfig.prototype.addValidator = function (validator) {
        this.validators.push(validator);
        return this;
    };
    return FormElementConfig;
}());

var FormConfig = (function () {
    function FormConfig(validationType, showErrorMessages, cssClassOnSuccess, cssClassOnError) {
        this.validationType = isString(validationType) && isValidValidationType(validationType) ? validationType : 'submit';
        this.formElementConfigs = {};
        this.showErrorMessages = isBoolean(showErrorMessages) ? showErrorMessages : true;
        this.cssClassOnSuccess = isBoolean(cssClassOnSuccess) ? cssClassOnSuccess : true;
        this.cssClassOnError = isBoolean(cssClassOnError) ? cssClassOnError : true;
    }
    FormConfig.prototype.addFormElementConfig = function (name, validators, updateType) {
        var config = new FormElementConfig(name, updateType);
        if (isArray(validators)) {
            validators.forEach(function (validator) {
                config.addValidator(validator);
            });
        }
        this.formElementConfigs[config.name] = config;
        return this;
    };
    FormConfig.prototype.getFormElementConfig = function (name) {
        if (this.formElementConfigs.hasOwnProperty(name)) {
            return this.formElementConfigs[name];
        }
    };
    return FormConfig;
}());

var FormElementBinding = (function () {
    function FormElementBinding(formBinding, element, bindedName, formElementConfig, formConfig) {
        this.formBinding = formBinding;
        this.element = element;
        this.bindedName = bindedName;
        this.formElementConfig = formElementConfig;
        this.formConfig = formConfig;
        this._subscribers = [];
        this._elementType = getElementType(element);
    }
    FormElementBinding.prototype._raiseStateChanged = function (element, errors) {
        this._subscribers.forEach(function (subscriber) {
            subscriber(element, errors);
        });
    };
    FormElementBinding.prototype._checkState = function (errors, next) {
        var error = errors[0];
        var hasError = isString(error);
        if (this.hasError !== hasError || this.firstError !== error) {
            // state changed
            this.hasError = hasError;
            this.firstError = error;
            this.errors = errors;
            this._raiseStateChanged(this.element, errors);
            next();
        }
    };
    FormElementBinding.prototype.onStateChanged = function (stateSubscriber) {
        this._subscribers.push(stateSubscriber);
    };
    return FormElementBinding;
}());
var FormElementWithSource = (function (_super) {
    __extends(FormElementWithSource, _super);
    function FormElementWithSource(formBinding, element, bindedName, formElementConfig, formConfig, source, initialValue, type) {
        var _this = _super.call(this, formBinding, element, bindedName, formElementConfig, formConfig) || this;
        _this.source = source;
        _this.sourceValue = initialValue;
        _this.type = type;
        _this._bind(_this.element, _this._elementType, _this.source, _this.bindedName, _this.sourceValue, _this.type, _this.formElementConfig, _this.formConfig);
        return _this;
    }
    FormElementWithSource.prototype._bind = function (element, elementType, source, bindedName, initialValue, type, formElementConfig, formConfig) {
        var _this = this;
        var canValidate;
        // html => obj
        bindHtmlElement(element, elementType, formElementConfig.updateType, function (event) {
            var targetValue = type === 'boolean' ? event.target.checked : convertHtmlValueToObjectValue(type, event.target.value);
            source[bindedName] = targetValue;
        });
        // obj => html
        bindObservableToElement(source, bindedName, element, elementType, function (newValue) {
            if (canValidate || _this.formBinding.canValidate) {
                var errors_1 = validateValue(newValue, formElementConfig.validators);
                _this._checkState(errors_1, function () {
                    updateElementState(element, errors_1, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                });
                canValidate = true;
            }
        });
        // initialvalue
        setHtmlElementValue(element, type, initialValue, elementType);
    };
    FormElementWithSource.prototype.validate = function () {
        var value = this.source[this.bindedName];
        this.errors = validateValue(value, this.formElementConfig.validators);
        this.hasError = this.errors.length > 0;
        return this.errors;
    };
    return FormElementWithSource;
}(FormElementBinding));
var FormElementWithArray = (function (_super) {
    __extends(FormElementWithArray, _super);
    function FormElementWithArray(formBinding, element, bindedName, formElementConfig, formConfig, source, array) {
        var _this = _super.call(this, formBinding, element, bindedName, formElementConfig, formConfig) || this;
        _this.source = source;
        _this.sourceValue = array;
        _this.type = array[0] ? typeof array[0] : 'string';
        _this._bind(_this.element, _this._elementType, _this.sourceValue, _this.type, _this.formElementConfig, _this.formConfig);
        return _this;
    }
    FormElementWithArray.prototype._bind = function (element, elementType, array, type, formElementConfig, formConfig) {
        var _this = this;
        var canValidate;
        // html => obj
        bindHtmlElement(element, elementType, formElementConfig.updateType, function (event) {
            var targetValue = type === 'boolean' ? event.target.checked : convertHtmlValueToObjectValue(type, event.target.value);
            var index = array.indexOf(targetValue);
            if (index === -1) {
                array.push(targetValue);
            }
            else {
                array.splice(index, 1);
            }
        });
        // obj => html
        bindObservableArrayToElement(array, element, elementType, function (event, newValue, index) {
            setValues(array, type, element, elementType);
            if (canValidate || _this.formBinding.canValidate) {
                var errors_2 = validateValue(newValue, formElementConfig.validators);
                _this._checkState(errors_2, function () {
                    updateElementState(element, errors_2, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                });
                canValidate = true;
            }
        });
        setValues(array, type, element, elementType);
    };
    FormElementWithArray.prototype.validate = function () {
        var value = this.source[this.bindedName];
        this.errors = validateValue(value, this.formElementConfig.validators);
        this.hasError = this.errors.length > 0;
        return this.errors;
    };
    return FormElementWithArray;
}(FormElementBinding));
var SimpleFormElement = (function (_super) {
    __extends(SimpleFormElement, _super);
    function SimpleFormElement(formBinding, element, bindedName, formElementConfig, formConfig) {
        var _this = _super.call(this, formBinding, element, bindedName, formElementConfig, formConfig) || this;
        _this._bind(_this.element, _this._elementType, _this.formElementConfig, _this.formConfig);
        return _this;
    }
    SimpleFormElement.prototype._bind = function (element, elementType, formElementConfig, formConfig) {
        var _this = this;
        var canValidate;
        bindHtmlElement(element, elementType, formElementConfig.updateType, function (event) {
            if (canValidate || _this.formBinding.canValidate) {
                var newValue = getElementValue(element, _this._elementType);
                _this.value = newValue;
                var errors_3 = validateValue(newValue, formElementConfig.validators);
                _this._checkState(errors_3, function () {
                    updateElementState(element, errors_3, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                });
                canValidate = true;
            }
        });
    };
    SimpleFormElement.prototype.validate = function () {
        var value = getElementValue(this.element, this._elementType);
        this.value = value;
        this.errors = validateValue(value, this.formElementConfig.validators);
        this.hasError = this.errors.length > 0;
        return this.errors;
    };
    return SimpleFormElement;
}(FormElementBinding));

var FormElementError = (function () {
    function FormElementError(element, message, value) {
        this.element = element;
        this.message = message;
        this.value = value;
    }
    return FormElementError;
}());

var FormSubmittedResponse = (function () {
    function FormSubmittedResponse(hasError, errors, form, source) {
        this.hasError = hasError;
        this.errors = errors;
        this.form = form;
        this.source = source;
    }
    return FormSubmittedResponse;
}());

var FormBinding = (function () {
    function FormBinding(selectorOrForm, source, formConfig) {
        this._subscribers = [];
        this._stateSubscribers = [];
        this._bindings = [];
        this.submitted = false;
        // form
        var form = findForm(selectorOrForm);
        if (!form) {
            throw new Error('No element found for the form');
        }
        this.form = form;
        // source
        this.source = source;
        // form config
        this.formConfig = isDefined(formConfig) ? formConfig : new FormConfig();
        this.validationType = formConfig.validationType;
        this._bind(form, source, this.formConfig);
        this._bindSubmit(form, source, this.formConfig);
    }
    Object.defineProperty(FormBinding.prototype, "canValidate", {
        get: function () {
            return (this.submitted || this.validationType === 'valuechanged');
        },
        enumerable: true,
        configurable: true
    });
    FormBinding.prototype._bind = function (form, source, formConfig) {
        var _this = this;
        for (var i = 0; i < form.elements.length; i++) {
            var element = form.elements[i];
            if (element.type !== 'submit') {
                // find binding
                var isEditableElement = isBindableElement(element);
                var bindedName = getBindedName(element);
                if (isEditableElement && bindedName) {
                    var formElementConfig = formConfig.getFormElementConfig(bindedName);
                    // source property ?
                    if (source && source.hasOwnProperty(bindedName)) {
                        var sourceValue = source[bindedName];
                        var type = typeof sourceValue;
                        // source value with no validations => create default config
                        if (!formElementConfig) {
                            formElementConfig = new FormElementConfig(bindedName);
                            formConfig.formElementConfigs[bindedName] = formElementConfig;
                        }
                        if (type === 'string' || type === 'number' || type === 'boolean') {
                            var binding = new FormElementWithSource(this, element, bindedName, formElementConfig, formConfig, source, sourceValue, type);
                            binding.onStateChanged(function (element, errors) {
                                _this._raiseStateChanged(element, errors);
                            });
                            this._bindings.push(binding);
                        }
                        else if (isArray(sourceValue)) {
                            // object/array
                            var binding = new FormElementWithArray(this, element, bindedName, formElementConfig, formConfig, source, sourceValue);
                            binding.onStateChanged(function (element, errors) {
                                _this._raiseStateChanged(element, errors);
                            });
                            this._bindings.push(binding);
                        }
                    }
                    else if (FormElementConfig) {
                        var binding = new SimpleFormElement(this, element, bindedName, formElementConfig, formConfig);
                        binding.onStateChanged(function (element, errors) {
                            _this._raiseStateChanged(element, errors);
                        });
                        this._bindings.push(binding);
                    }
                }
            }
        }
    };
    FormBinding.prototype._validateAll = function (form, source, formConfig) {
        var hasError = false, allErrors = [], validated = {};
        this._bindings.forEach(function (binding) {
            if (!validated.hasOwnProperty(binding.bindedName)) {
                var value = binding instanceof FormElementWithSource ? binding.sourceValue : binding.value;
                var errors = binding.validate();
                if (errors.length > 0) {
                    hasError = true;
                    allErrors.push(new FormElementError(binding.element, errors[0], value));
                }
                updateElementState(binding.element, errors, formConfig.showErrorMessages, formConfig.cssClassOnSuccess, formConfig.cssClassOnError);
                validated[binding.bindedName] = 'validated';
            }
        });
        this.submitted = true;
        var formResponse = new FormSubmittedResponse(hasError, allErrors, this.form, this.source);
        this._raise(formResponse);
    };
    FormBinding.prototype._bindSubmit = function (form, source, formConfig) {
        var _this = this;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            _this._validateAll(form, source, formConfig);
        });
    };
    FormBinding.prototype._raise = function (response) {
        this._subscribers.forEach(function (subscriber) {
            subscriber(response);
        });
    };
    FormBinding.prototype._raiseStateChanged = function (element, errors) {
        this._validateAll(this.form, this.source, this.formConfig);
        this._stateSubscribers.forEach(function (stateSubscriber) {
            stateSubscriber(element, errors);
        });
    };
    FormBinding.prototype.onStateChanged = function (stateSubscriber) {
        this._stateSubscribers.push(stateSubscriber);
    };
    FormBinding.prototype.onSubmit = function (subscriber) {
        this._subscribers.push(subscriber);
    };
    return FormBinding;
}());

function isRequired(value) {
    return value === null || isUndefined(value) || value === '' || (isBoolean(value) && value === false);
}
function formatMessage(message, searchValue, replaceValue) {
    return message.replace(searchValue, replaceValue);
}
var Validator = (function () {
    function Validator() {
    }
    Validator.required = function (message) {
        return new RequiredValidator(message);
    };
    Validator.minLength = function (minLength, message) {
        return new MinLengthValidator(minLength, message);
    };
    Validator.maxLength = function (maxLength, message) {
        return new MaxLengthValidator(maxLength, message);
    };
    Validator.pattern = function (pattern, message) {
        return new PatternValidator(pattern, message);
    };
    Validator.custom = function (fn, message) {
        return new CustomValidator(fn, message);
    };
    return Validator;
}());
var RequiredValidator = (function (_super) {
    __extends(RequiredValidator, _super);
    function RequiredValidator(message) {
        var _this = _super.call(this) || this;
        _this.message = isString(message) ? message : 'This field is required.';
        return _this;
    }
    RequiredValidator.prototype.validate = function (value) {
        if (isRequired(value)) {
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    };
    return RequiredValidator;
}(Validator));
var MinLengthValidator = (function (_super) {
    __extends(MinLengthValidator, _super);
    function MinLengthValidator(minLength, message) {
        var _this = _super.call(this) || this;
        _this.minLength = isNumber(minLength) ? minLength : 3;
        _this.message = isString(message) ? message : formatMessage('Please enter at least than {0} characters.', '{0}', minLength);
        return _this;
    }
    MinLengthValidator.prototype.validate = function (value) {
        if (!isRequired(value) && value.length < this.minLength) {
            // error
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    };
    return MinLengthValidator;
}(Validator));
var MaxLengthValidator = (function (_super) {
    __extends(MaxLengthValidator, _super);
    function MaxLengthValidator(maxLength, message) {
        var _this = _super.call(this) || this;
        _this.maxLength = isNumber(maxLength) ? maxLength : 30;
        _this.message = isString(message) ? message : formatMessage('Please enter no more than {0} characters.', '{0}', maxLength);
        return _this;
    }
    MaxLengthValidator.prototype.validate = function (value) {
        if (!isRequired(value) && value.length > this.maxLength) {
            // error
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    };
    return MaxLengthValidator;
}(Validator));
var PatternValidator = (function (_super) {
    __extends(PatternValidator, _super);
    function PatternValidator(pattern, message) {
        var _this = _super.call(this) || this;
        _this.pattern = pattern;
        _this.message = isString(message) ? message : 'Please fix this field.';
        return _this;
    }
    PatternValidator.prototype.validate = function (value) {
        if (!isRequired(value) && !this.pattern.test(value)) {
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    };
    return PatternValidator;
}(Validator));
var CustomValidator = (function (_super) {
    __extends(CustomValidator, _super);
    function CustomValidator(fn, message) {
        var _this = _super.call(this) || this;
        _this.fn = fn;
        _this.message = isString(message) ? message : 'Please fix this field.';
        return _this;
    }
    CustomValidator.prototype.validate = function (value) {
        if (!isRequired(value) && !this.fn(value)) {
            this.error = this.message;
            return false;
        }
        else {
            this.error = undefined;
            return true;
        }
    };
    return CustomValidator;
}(Validator));

var HttpResponse = (function () {
    function HttpResponse() {
    }
    Object.defineProperty(HttpResponse.prototype, "isSuccessStatusCode", {
        /*
        RESPONSE
        - headers
        - body
        - status https://fr.wikipedia.org/wiki/Liste_des_codes_HTTP
        - is success status code:
            - GET => 200
            - POST => 201
            - PUT => 200
            - DELETE => 200 | 204
            - HEAD => 200
            - PATCH => 200
            - OPTIONS => 204
        */
        get: function () {
            return this.status >= 200 && this.status <= 299;
        },
        enumerable: true,
        configurable: true
    });
    HttpResponse.prototype.getHeader = function (header) {
        return this.headers[header];
    };
    return HttpResponse;
}());

function isValidMethod(value) {
    return /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)$/i.test(value);
}
function normalizeMethod(value) {
    return value.toUpperCase();
}
function createXhr() {
    return new XMLHttpRequest();
}
function createRequest(method, url, jsonContent, access_token) {
    var request = new HttpRequest({ method: method, url: url });
    if (jsonContent) {
        request.addHeader('content-type', 'application/json');
        request.body = jsonContent;
    }
    if (access_token) {
        request.addHeader('Authorization', 'Bearer ' + access_token);
    }
    return request;
}
function extractResponseHeaders(headersString) {
    var result = {};
    if (isString(headersString)) {
        var headerSplits = headersString.trim().split(/\r?\n/);
        headerSplits.forEach(function (headerString) {
            var keyValue = headerString.split(': ');
            if (keyValue[1]) {
                result[keyValue[0]] = keyValue[1];
            }
        });
    }
    return result;
}
function getHooks(type, interceptors) {
    var hooks = [];
    interceptors.forEach(function (interceptor) {
        if (isFunction(interceptor[type])) {
            hooks.push(interceptor[type]);
        }
    });
    return hooks;
}
function createResponse(xhr, request) {
    var response = new HttpResponse();
    response.status = xhr.status;
    response.statusText = xhr.statusText;
    response.headers = extractResponseHeaders(xhr.getAllResponseHeaders());
    response.url = xhr.responseURL || response.getHeader('X-Request-URL');
    response.body = xhr.response || xhr.responseText;
    return response;
}
function sendRequest(request, next) {
    var xhr = createXhr();
    if (xhr) {
        var method = request.method, handler = function () {
            next(createResponse(xhr, request));
        };
        // abort
        request.abort = function () {
            xhr.abort();
        };
        // progress
        if (request.progress) {
            if (method === 'GET') {
                xhr.addEventListener('progress', request.progress);
            }
            else if (method === 'POST' || method === 'PUT') {
                xhr.upload.addEventListener('progress', request.progress);
            }
        }
        // open
        xhr.open(method, request.url, request.async);
        // headers
        if (request.headers) {
            for (var header in request.headers) {
                if (request.headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, request.headers[header]);
                }
            }
        }
        // response type
        if (request.responseType) {
            xhr.responseType = request.responseType;
        }
        // timeout (milliseconds)
        if (request.timeout) {
            xhr.timeout = request.timeout;
        }
        // credentials
        if (request.credentials === true) {
            xhr.withCredentials = true;
        }
        // error | abort | timeout => status code 0
        xhr.onload = handler;
        xhr.onabort = handler;
        xhr.onerror = handler;
        xhr.ontimeout = handler;
        // send
        var data = isDefined(request.body) ? request.body : null;
        xhr.send(data);
    }
    else {
        throw new Error('XMLHttpRequest not supported');
    }
}

var HttpRequest = (function () {
    function HttpRequest(config) {
        /*
        REQUEST
        - method (GET | POST | PUT | DELETE | HEAD | OPTIONS | PATCH)
        - url (scheme: HOST [ ":" PORT ] [ ABS_PATH [ "?" QUERY ]], http | https)
        - headers => key | value (example 'content-type' 'application/json')
        - body (JSON, Text, XML, HTML => changed content-type)
        */
        // method
        if (config.method) {
            if (!isValidMethod(config.method)) {
                throw new Error('Invalid http method (GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)');
            }
            this.method = normalizeMethod(config.method);
        }
        else {
            this.method = 'GET';
        }
        // url
        if (!isString(config.url)) {
            throw new Error('Url required');
        }
        this.url = config.url;
        // headers
        this.headers = {};
        if (config.headers) {
            for (var header in config.headers) {
                if (config.headers.hasOwnProperty(header)) {
                    this.addHeader(header, config.headers[header]);
                }
            }
        }
        // async
        this.async = isBoolean(config.async) ? config.async : true;
        // body
        this.body = config.body;
        // response type
        if (config.responseType) {
            this.responseType = config.responseType;
        }
        // progress
        if (isFunction(config.progress)) {
            this.progress = config.progress;
        }
        // timeout
        if (isNumber(config.timeout)) {
            this.timeout = config.timeout;
        }
        // credentials
        if (isBoolean(config.credentials)) {
            this.credentials = config.credentials;
        }
    }
    HttpRequest.prototype.addHeader = function (header, value) {
        this.headers[header] = value;
        return this;
    };
    HttpRequest.prototype.setResponseType = function (responseType) {
        this.responseType = responseType;
        return this;
    };
    return HttpRequest;
}());

var Http = (function () {
    function Http() {
        this.interceptors = [];
    }
    Http.prototype._intercept = function (type, r, onComplete, onAbort) {
        var hooks = getHooks(type, this.interceptors), length = hooks.length, index = 0;
        function next(hook) {
            hook(r, function (canContinue) {
                if (canContinue) {
                    index++;
                    if (index < length) {
                        next(hooks[index]);
                    }
                    else {
                        onComplete();
                    }
                }
                else {
                    onAbort();
                }
            });
        }
        if (length > 0) {
            next(hooks[0]);
        }
        else if (onComplete) {
            onComplete();
        }
    };
    Http.prototype.load = function (url, onSuccess, onError) {
        if (!isString(url)) {
            throw new Error('Url required');
        }
        var request = new HttpRequest({ url: url });
        sendRequest(request, function (response) {
            if (response.status === 200) {
                onSuccess(response.body);
            }
            else if (onError) {
                onError(response);
            }
        });
    };
    Http.prototype.send = function (request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._intercept('before', request, function () {
                try {
                    sendRequest(request, function (response) {
                        _this._intercept('after', response, function () {
                            if (response.isSuccessStatusCode) {
                                resolve(response);
                            }
                            else {
                                reject(response);
                            }
                        }, function () {
                            reject(response);
                        });
                    });
                }
                catch (error) {
                    reject(error);
                }
            }, function () {
                var response = new HttpResponse();
                response.status = 401;
                reject(response);
            });
        });
    };
    Http.prototype.get = function (url, access_token) {
        var request = createRequest('GET', url, null, access_token);
        return this.send(request);
    };
    
    Http.prototype.post = function (url, jsonContent, access_token) {
        var request = createRequest('POST', url, jsonContent, access_token);
        return this.send(request);
    };
    
    Http.prototype.put = function (url, jsonContent, access_token) {
        var request = createRequest('PUT', url, jsonContent, access_token);
        return this.send(request);
    };
    
    Http.prototype.delete = function (url, access_token) {
        var request = createRequest('DELETE', url, null, access_token);
        return this.send(request);
    };
    
    return Http;
}());

var Messenger = (function () {
    function Messenger() {
        this._cache = {};
    }
    Messenger.prototype.getSubscribers = function (event) {
        return this._cache[event];
    };
    Messenger.prototype.isRegistered = function (event) {
        return this._cache.hasOwnProperty(event);
    };
    Messenger.prototype.subscribe = function (event, subscriber) {
        if (isUndefined(event))
            throw new Error('Event required');
        if (isUndefined(subscriber))
            throw new Error('Subscriber required');
        if (!this.isRegistered(event)) {
            this._cache[event] = [];
        }
        this._cache[event].push(subscriber);
    };
    Messenger.prototype.publish = function (event) {
        var results = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            results[_i - 1] = arguments[_i];
        }
        if (this.isRegistered(event)) {
            this._cache[event].forEach(function (subscriber) {
                subscriber.apply(void 0, results);
            });
        }
    };
    Messenger.prototype.unsubscribe = function (event, subscriber) {
        if (isUndefined(event))
            throw new Error('Event required');
        if (this.isRegistered(event)) {
            if (isFunction(subscriber)) {
                var index = this._cache[event].indexOf(subscriber);
                if (index !== -1) {
                    this._cache[event].splice(index, 1);
                    return true;
                }
            }
            else {
                delete this._cache[event];
                return true;
            }
        }
        return false;
    };
    Messenger.prototype.clear = function () {
        this._cache = {};
    };
    return Messenger;
}());

var OAuth = (function () {
    function OAuth(config) {
        if (isUndefined(config))
            throw new Error('Config required');
        if (isUndefined(config.clientId))
            throw new Error('clientId required');
        if (isUndefined(config.redirectUrl))
            throw new Error('redirectUrl required');
        this._http = new Http();
        this.clientId = config.clientId;
        this.redirectUrl = config.redirectUrl;
    }
    OAuth.prototype.getCodeUrl = function () {
        if (isUndefined(this.authUrl))
            throw new Error('authUrl required');
        return this.authUrl
            + '?client_id=' + this.clientId
            + '&redirect_uri=' + this.redirectUrl
            + '&scope=' + this.scope
            + '&response_type=code';
    };
    OAuth.prototype.getProfile = function (access_token) {
        var _this = this;
        if (isUndefined(access_token))
            throw new Error('access_token required');
        if (isUndefined(this.profileUrl))
            throw new Error('profileUrl required');
        var url = isUndefined(this.fields) ? this.profileUrl : this.profileUrl + '?fields=' + this.fields;
        return new Promise(function (resolve, reject) {
            _this._http.get(url, access_token).then(function (response) {
                resolve(response.body);
            }).catch(function (response) {
                reject(response);
            });
        });
    };
    OAuth.prototype.getTokenUrl = function () {
        // implicit flow
        // response : http://.../#access_token=ya29.CjCmA3KKBZH7ElidD3j_peoQaPdy2G099Ek6DYuYRfwFqSMXpR3i2_2xSjjHBo6FNNo&token_type=Bearer&expires_in=3600
        if (isUndefined(this.authUrl))
            throw new Error('authUrl required');
        return this.authUrl
            + '?client_id=' + this.clientId
            + '&redirect_uri=' + this.redirectUrl
            + '&scope=' + this.scope
            + '&response_type=token';
    };
    
    return OAuth;
}());

var FacebookAuth = (function (_super) {
    __extends(FacebookAuth, _super);
    function FacebookAuth(config) {
        var _this = _super.call(this, config) || this;
        _this.scope = config.scope || 'public_profile,email';
        _this.authUrl = config.authUrl || 'https://www.facebook.com/dialog/oauth';
        _this.profileUrl = config.profileUrl || 'https://graph.facebook.com/me';
        _this.fields = config.fields || 'id,name,email';
        return _this;
    }
    return FacebookAuth;
}(OAuth));

var GoogleAuth = (function (_super) {
    __extends(GoogleAuth, _super);
    function GoogleAuth(config) {
        var _this = _super.call(this, config) || this;
        _this.scope = config.scope || 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
        _this.authUrl = config.authUrl || 'https://accounts.google.com/o/oauth2/auth';
        _this.profileUrl = config.profileUrl || 'https://www.googleapis.com/oauth2/v1/userinfo';
        return _this;
    }
    return GoogleAuth;
}(OAuth));

var SpecializedStackItemType;
(function (SpecializedStackItemType) {
    SpecializedStackItemType[SpecializedStackItemType["onResolved"] = 0] = "onResolved";
    SpecializedStackItemType[SpecializedStackItemType["onRejected"] = 1] = "onRejected";
})(SpecializedStackItemType || (SpecializedStackItemType = {}));
var SpecializedStackItem = (function () {
    function SpecializedStackItem(type, fn) {
        this.type = type;
        this.fn = fn;
    }
    return SpecializedStackItem;
}());
var SpecializedStack = (function () {
    function SpecializedStack() {
        this._stack = [];
    }
    SpecializedStack.prototype._getNextItemIndex = function (type) {
        var length = this._stack.length;
        for (var i = 0; i < length; i++) {
            var item = this._stack[i];
            if (item.type === type) {
                return i;
            }
        }
        return -1;
    };
    SpecializedStack.prototype._splice = function (index) {
        this._stack.splice(0, index);
    };
    SpecializedStack.prototype.clear = function () {
        this._stack = [];
    };
    SpecializedStack.prototype.push = function (type, fn) {
        this._stack.push(new SpecializedStackItem(type, fn));
    };
    SpecializedStack.prototype.next = function (type) {
        var index = this._getNextItemIndex(type);
        if (index !== -1) {
            this._splice(index);
        }
        else {
            this.clear();
        }
        return this._stack.shift();
    };
    return SpecializedStack;
}());

var PromiseResultState;
(function (PromiseResultState) {
    PromiseResultState[PromiseResultState["completed"] = 0] = "completed";
    PromiseResultState[PromiseResultState["waitOnResolvedCallback"] = 1] = "waitOnResolvedCallback";
    PromiseResultState[PromiseResultState["waitOnRejectedCallback"] = 2] = "waitOnRejectedCallback";
})(PromiseResultState || (PromiseResultState = {}));
function resolve(root, result) {
    root._result = result;
    var item = root._stack.next(SpecializedStackItemType.onResolved);
    if (item) {
        item.fn();
    }
    else {
        root._state = PromiseResultState.waitOnResolvedCallback;
    }
}
function reject(root, reason) {
    root._reason = reason;
    var item = root._stack.next(SpecializedStackItemType.onRejected);
    if (item) {
        item.fn();
    }
    else {
        root._state = PromiseResultState.waitOnRejectedCallback;
    }
}
function then(root, promise, onComplete, onRejection) {
    var hasComplete = isFunction(onComplete), hasRejection = isFunction(onRejection);
    promise._child = new TSChildPromise(root);
    function _doCompletion() {
        try {
            var returnValue = onComplete(root._result);
            promise._child.resolve(returnValue);
        }
        catch (error) {
            promise._child.reject(error);
        }
    }
    function _doRejection() {
        try {
            var returnValue = onRejection(root._reason);
            promise._child.resolve(returnValue);
        }
        catch (error) {
            promise._child.reject(error);
        }
    }
    if (hasComplete) {
        root._stack.push(SpecializedStackItemType.onResolved, function () {
            _doCompletion();
        });
    }
    if (hasRejection) {
        root._stack.push(SpecializedStackItemType.onRejected, function () {
            _doRejection();
        });
    }
    if (hasComplete && root._state === PromiseResultState.waitOnResolvedCallback) {
        var item = root._stack.next(SpecializedStackItemType.onResolved);
        if (item) {
            item.fn();
        }
    }
    else if (hasRejection && root._state === PromiseResultState.waitOnRejectedCallback) {
        var item = root._stack.next(SpecializedStackItemType.onRejected);
        if (item) {
            item.fn();
        }
    }
    return promise._child;
}
var TSPromiseBase = (function () {
    function TSPromiseBase() {
    }
    return TSPromiseBase;
}());
var TSPromise = (function (_super) {
    __extends(TSPromise, _super);
    function TSPromise(executor) {
        var _this = _super.call(this) || this;
        _this._stack = new SpecializedStack();
        try {
            if (isFunction(executor)) {
                executor(function (result) {
                    _this.resolve(result);
                }, function (reason) {
                    _this.reject(reason);
                });
            }
        }
        catch (error) {
            _this.reject(error);
        }
        return _this;
    }
    TSPromise.prototype.resolve = function (result) {
        resolve(this, result);
    };
    TSPromise.prototype.reject = function (reason) {
        reject(this, reason);
    };
    TSPromise.prototype.then = function (onComplete, onRejection) {
        return then(this, this, onComplete, onRejection);
    };
    TSPromise.prototype.catch = function (onRejection) {
        return then(this, this, null, onRejection);
    };
    TSPromise.all = function (promises) {
        var results = [], isCompleted = false, length = promises.length, index = 0;
        var promiseAll = new TSPromise();
        for (var i = 0; i < length; i++) {
            var promise = promises[i];
            try {
                promise.then(function (result) {
                    if (!isCompleted) {
                        results.push(result);
                        index++;
                        if (index === length) {
                            isCompleted = true;
                            promiseAll.resolve(results);
                        }
                    }
                }, function (reason) {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseAll.reject(reason);
                    }
                });
            }
            catch (error) {
                isCompleted = true;
                promiseAll.reject(error);
            }
        }
        return promiseAll;
    };
    TSPromise.race = function (promises) {
        var isCompleted = false, length = promises.length, index = 0;
        var promiseRace = new TSPromise();
        for (var i = 0; i < length; i++) {
            var promise = promises[i];
            try {
                promise.then(function (result) {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseRace.resolve(result);
                    }
                }, function (reason) {
                    if (!isCompleted) {
                        isCompleted = true;
                        promiseRace.reject(reason);
                    }
                });
            }
            catch (error) {
                isCompleted = true;
                promiseRace.reject(error);
            }
        }
        return promiseRace;
    };
    return TSPromise;
}(TSPromiseBase));
var TSChildPromise = (function (_super) {
    __extends(TSChildPromise, _super);
    function TSChildPromise(root) {
        var _this = _super.call(this) || this;
        _this._root = root;
        return _this;
    }
    TSChildPromise.prototype.resolve = function (result) {
        resolve(this._root, result);
    };
    TSChildPromise.prototype.reject = function (reason) {
        reject(this._root, reason);
    };
    TSChildPromise.prototype.then = function (onComplete, onRejection) {
        return then(this._root, this, onComplete, onRejection);
    };
    TSChildPromise.prototype.catch = function (onRejection) {
        return then(this._root, this, null, onRejection);
    };
    return TSChildPromise;
}(TSPromiseBase));

exports.Cache = Cache;
exports.FormBinding = FormBinding;
exports.CustomValidator = CustomValidator;
exports.FormConfig = FormConfig;
exports.FormElementConfig = FormElementConfig;
exports.MaxLengthValidator = MaxLengthValidator;
exports.MinLengthValidator = MinLengthValidator;
exports.PatternValidator = PatternValidator;
exports.RequiredValidator = RequiredValidator;
exports.Validator = Validator;
exports.FormSubmittedResponse = FormSubmittedResponse;
exports.FormElementError = FormElementError;
exports.Http = Http;
exports.HttpRequest = HttpRequest;
exports.HttpResponse = HttpResponse;
exports.Messenger = Messenger;
exports.Observable = Observable;
exports.ObservableArray = ObservableArray;
exports.FacebookAuth = FacebookAuth;
exports.GoogleAuth = GoogleAuth;
exports.OAuth = OAuth;
exports.TSPromise = TSPromise;
exports.IndexedDBService = IndexedDBService;
exports.StorageService = StorageService;
exports.CookieService = CookieService;
exports.supportStorage = supportStorage;

Object.defineProperty(exports, '__esModule', { value: true });

})));
