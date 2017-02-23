export enum SpecializedStackItemType {
    onResolved,
    onRejected
}

export class SpecializedStackItem {
    constructor(public type: SpecializedStackItemType, public fn: Function) { }
}

export class SpecializedStack {
    _stack: SpecializedStackItem[];
    constructor() {
        this._stack = [];
    }
    _getNextItemIndex(type: SpecializedStackItemType) {
        let length = this._stack.length;
        for (let i = 0; i < length; i++) {
            let item = this._stack[i];
            if (item.type === type) {
                return i;
            }
        }
        return -1;
    }
    _splice(index: number): void {
        this._stack.splice(0, index);
    }
    clear(): void {
        this._stack = [];
    }
    push(type: SpecializedStackItemType, fn: Function): void {
        this._stack.push(new SpecializedStackItem(type, fn));
    }
    next(type: SpecializedStackItemType): SpecializedStackItem {
        let index = this._getNextItemIndex(type);
        if (index !== -1) {
            this._splice(index);
        }
        else {
            this.clear();
        }
        return this._stack.shift();
    }
}