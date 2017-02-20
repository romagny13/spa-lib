// Type definitions for spa-lib 0.0.1
// Project: https://github.com/romagny13/spa-lib
// Definitions by: romagny13 <https://github.com/romagny13>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface FormElementBinding {
    formBinding: FormBinding;
    element: any;
    bindedName: string;
    formElementConfig: FormElementConfig;
    formConfig: FormConfig;
    hasError: boolean;
    errors: string[];
    firstError: string;
    onStateChanged(stateSubscriber: Function): void;
}

interface FormElementWithSource extends FormElementBinding {
    source: any;
    sourceValue: any;
    type: string;
    new (formBinding: FormBinding,
        element: any,
        bindedName: string,
        formElementConfig: FormElementConfig,
        formConfig: FormConfig,
        source: any,
        initialValue: any,
        type: string): FormElementWithSource;
    validate(): string[];
}

interface FormElementWithArray extends FormElementBinding {
    source: any;
    sourceValue: any[];
    type: string;
    new (formBinding: FormBinding,
        element: any,
        bindedName: string,
        formElementConfig: FormElementConfig,
        formConfig: FormConfig,
        source: any,
        array: any): FormElementWithArray;
    validate(): string[];
}

interface SimpleFormElement extends FormElementBinding {
    value: any;
    new (formBinding: FormBinding, element: any, bindedName: string, formElementConfig: FormElementConfig, formConfig: FormConfig): SimpleFormElement;
    validate(): string[];
}

interface Validator {
    error: string;
    message: string;
}

interface RequiredValidator extends Validator {
    new (message?: string): RequiredValidator;
    validate(value: any): boolean;
}

interface MinLengthValidator extends Validator {
    minLength: number;
    new (minLength?: number, message?: string): MinLengthValidator;
    validate(value: any): boolean;
}

interface MaxLengthValidator extends Validator {
    maxLength: number;
    new (maxLength?: number, message?: string): MaxLengthValidator;
    validate(value: any): boolean;
}

interface PatternValidator extends Validator {
    pattern: any;
    new (pattern: any, message?: string): PatternValidator;
    validate(value: any): boolean;
}

interface CustomValidator extends Validator {
    fn: Function;
    new (fn: Function, message?: string): CustomValidator;
    validate(value: any): boolean;
}

interface FormElementConfig {
    name: string;
    updateType: string;
    validators: any[];
    new (name: string, updateType?: string): FormElementConfig;
    setUpdateType(updateType: string): FormElementConfig;
    addValidator(validator: Validator): FormElementConfig;
}

interface FormConfig {
    validationType: string;
    formElementConfigs: any;
    showErrorMessages: boolean;
    cssClassOnSuccess: boolean;
    cssClassOnError: boolean;
    new (validationType?: string, showErrorMessages?: boolean, cssClassOnSuccess?: boolean, cssClassOnError?: boolean): FormConfig;
    addFormElementConfig(config: FormElementConfig): FormConfig;
    getFormElementConfig(name: string): FormElementConfig;
}

interface FormBinding {
    source: any;
    form: any;
    formConfig: FormConfig;
    validationType: string;
    submitted: boolean;
    new (selectorOrForm: any, source: any, formConfig?: FormConfig): FormBinding;
    canValidate: boolean;
    onStateChanged(stateSubscriber: Function): void;
    onSubmit(subscriber: Function): void;
}

interface Cache {
    length: number;
    new (): Cache;
    has(key: string): boolean;
    store(key: string, value: any): void;
    retrieve(key: string): any;
    remove(key: string): boolean;
    clear(): void;
    save(key: string): void;
    restore(key: string): boolean;
}

interface FormElementError {
    element: any;
    message: string;
    value: any;
}

interface FormSubmittedResponse {
    hasError: boolean;
    errors: FormElementError[];
    form: HTMLFormElement;
    source: any;
}

interface HttpInterceptor {
    before(request: HttpRequest, next: Function): void;
    after(response: HttpResponse, next: Function): void;
}

interface HttpResponse {
    new (): HttpResponse;
    headers: any;
    content: any;
    status: number;
    isSuccessStatusCode: boolean;
}

interface HttpRequest {
    headers: any;
    method: string;
    url: string;
    responseType: string;
    async: boolean;
    data: any;
    new (config: {
        url: string;
        headers?: any;
        method?: string;
        responseType?: string;
        async?: boolean;
        data?: any;
    }): HttpRequest;
    addHeader(header: string, value: string): HttpRequest;
    setResponseType(responseType: string): HttpRequest;
}

interface Http {
    new (): Http;
    interceptors: HttpInterceptor[];
    load(url: string, onSuccess: Function, onError?: Function): void;
    send(request: HttpRequest): Promise<any>;
    get(url: string, access_token?: string): Promise<any>;
    post(url: string, jsonContent?: string, access_token?: string): Promise<any>;
    put(url: string, jsonContent?: string, access_token?: string): Promise<any>;
    delete(url: string, access_token?: string): Promise<any>;
}

interface Messenger {
    new (): Messenger;
    getSubscribers(event: any): any[];
    isRegistered(event: any): boolean;
    subscribe(event: any, subscriber: Function): void;
    publish(event: any, ...results: any[]): void;
    unsubscribe(event: any, subscriber?: Function): boolean;
    clear(): void;
}

interface ObservableArray {
    new (array: any[]): ObservableArray;
    subscribe(subscriber: Function): void;
    unsubscribe(subscriber: Function): boolean;
}

interface Observable {
    new (obj: any, name: string): Observable;
    subscribe(subscriber: Function): void;
    unsubscribe(subscriber: Function): boolean;
}

interface OAuth {
    clientId: string;
    redirectUrl: string;
    scope: string;
    authUrl: string;
    profileUrl: string;
    fields: string;
    new (config: {
        clientId: string,
        redirectUrl: string,
        scope?: string,
        authUrl?: string,
        profileUrl?: string,
        fields?: string
    }): OAuth;
    getCodeUrl(): string;
    getProfile(access_token: string): Promise<any>;
    getTokenUrl(): string;
}

interface GoogleAuth extends OAuth {
    new (config: {
        clientId: string,
        redirectUrl: string,
        scope?: string,
        authUrl?: string,
        profileUrl?: string,
        fields?: string
    }): GoogleAuth;
}

interface FacebookAuth extends OAuth {
    new (config: {
        clientId: string,
        redirectUrl: string,
        scope?: string,
        authUrl?: string,
        profileUrl?: string,
        fields?: string
    }): FacebookAuth;
}

interface Promise<T> {
    new (): Promise<T>;
    then(): void;
    catch(): void;
}

interface IndexedDBService {
    new (dbConfigs?: any[]): IndexedDBService;
    getDbConfig(dbName: string): any;
    openCreateDb(dbName: string, dbVersion: number): Promise<any>;
    closeDb(): void;
    deleteDb(dbName: string): Promise<any>;
    createObjectStore(db: any, objectStoreName: string, key: any, indexes?: any[]): void;
    getObjectStore(objectStoreName: string, readMode: string, reject?: Function): any;
    insert(objectStoreName: string, data: any): Promise<any>;
    update(objectStoreName: string, key: any, data: any): Promise<any>;
    delete(objectStoreName: string, key: string): Promise<any>;
    count(objectStoreName: string): Promise<any>;
    getAll(objectStoreName: string): Promise<any>;
    getOne(objectStoreName: string, key: string): Promise<any>;
}

interface StorageService {
    new (strategy?: string): StorageService;
    set(key: string, value: any): void;
    get(key: string): any;
    has(key: string): boolean;
    remove(key: string): boolean;
    getValues(): any;
    getKeys(): any;
    clear(): void;
}

interface CookieService {
    new (): CookieService;
    set(name: string, value: string, expiration?: number): void;
    get(name: string): string;
    has(name: string): boolean;
    delete(name: string): boolean;
    clear(): void;
}

interface PromiseBase {
    resolve(result?: any): void;
    reject(reason?: any): void;
}

interface TSPromiseArray extends PromiseBase {
    then(onSuccess: Function, onError?: Function, onNotify?: Function): TSPromise;
    catch(onError: Function): TSPromise;
}

interface TSPromise extends PromiseBase {
    new (fn?: Function): TSPromise;
    then(onSuccess: Function, onError?: Function): TSPromise;
    catch(onError: Function): TSPromise;
    all(promises: any[]): TSPromiseArray;
    race(promises: any[]): TSPromiseArray;
}

interface SpaLibStatic {
    Cache: Cache;
    FormBinding: FormBinding;
    CustomValidator: CustomValidator;
    FormConfig: FormConfig;
    FormElementConfig: FormElementConfig;
    MaxLengthValidator: MaxLengthValidator;
    MinLengthValidator: MinLengthValidator;
    PatternValidator: PatternValidator;
    RequiredValidator: RequiredValidator;
    Validator: Validator;
    FormSubmittedResponse: FormSubmittedResponse;
    FormElementError: FormElementError;
    Http: Http;
    HttpRequest: HttpRequest,
    HttpResponse: HttpResponse;
    Messenger: Messenger;
    Observable: Observable;
    ObservableArray: ObservableArray;
    FacebookAuth: FacebookAuth;
    GoogleAuth: GoogleAuth;
    OAuth: OAuth;
    IndexedDBService: IndexedDBService;
    StorageService: StorageService;
    CookieService: CookieService;
    TSPromise: TSPromise;
}

declare var SpaLib: SpaLibStatic;

declare module 'spa-lib' {
    export = SpaLib;
}
