export function isUndefined(value) { return typeof value === 'undefined'; }
export function isDefined(value) { return typeof value !== 'undefined'; }
export function isString(value) { return typeof value === 'string'; }
export function isNumber(value) { return typeof value === 'number'; }
export function isObject(value) { return value !== null && typeof value === 'object'; }
export function isFunction(value) { return typeof value === 'function'; }
export function isBoolean(value) { return typeof value === 'boolean'; }
export function isDate(value) { return toString.call(value) === '[object Date]'; }
export let isArray = Array.isArray;
export function isPromise(obj) { return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'; }

export function getFunctionName(fn) {
    return fn.name || fn.toString().match(/^function\s*([^\s(]+)/)[1];
}

export function extend(source, target) {
    if (typeof source === 'object') {
        for (let property in source) {
            if (!target.hasOwnProperty(property)) {
                target[property] = source[property];
            }
        }
    }
    return target;
}
