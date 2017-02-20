export function getExpirationDateString(expiration: number) {
    const date = new Date();
    date.setTime(date.getTime() + (expiration * 24 * 60 * 60 * 1000));
    return date.toUTCString();
}

export function tryGetObject(value) {
    try {
        let result = JSON.parse(value);
        return result;
    }
    catch (e) {
        return null;
    }
}

export function supportStorage(): boolean {
    return typeof (Storage) !== undefined;
}

export function getIndexedDB() {
    let w: any = window;
    return w.indexedDB || w.webkitIndexedDB || w.mozIndexedDB || w.msIndexedDB;
}