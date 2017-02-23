import { assert } from 'chai';
import { SpecializedStack, SpecializedStackItem, SpecializedStackItemType } from '../../../src/promise/stack';

describe('SpecializedStack', () => {
    let stack: SpecializedStack,
        length: number;

    before(() => {
        stack = new SpecializedStack();
        stack.push(SpecializedStackItemType.onResolved, () => 'resolved 1');
        stack.push(SpecializedStackItemType.onResolved, () => 'resolved 2');
        stack.push(SpecializedStackItemType.onResolved, () => 'resolved 3');
        stack.push(SpecializedStackItemType.onRejected, () => 'rejected 1');
        stack.push(SpecializedStackItemType.onRejected, () => 'rejected 2');
        stack.push(SpecializedStackItemType.onRejected, () => 'rejected 3');
        stack.push(SpecializedStackItemType.onRejected, () => 'rejected 4');
        length = stack._stack.length;
    });

    it('Should find next resolved at index 0', () => {
        let index = stack._getNextItemIndex(SpecializedStackItemType.onResolved);
        assert.equal(index, 0);
    });

    it('Should find next rejected at index 3', () => {
        let index = stack._getNextItemIndex(SpecializedStackItemType.onRejected);
        assert.equal(index, 3);
    });

    it('Should move to next resolved item (0) return this item (shift)', () => {
        let item = stack.next(SpecializedStackItemType.onResolved);
        let result = item.fn();
        assert.equal(result, 'resolved 1');
    });

    it('Should remove shift item from stack', () => {
        let current = stack._stack.length;
        assert.equal(current, length - 1);
    });

    it('Should move to next resolved item (1) return this item (shift)', () => {
        let item = stack.next(SpecializedStackItemType.onResolved);
        let result = item.fn();
        assert.equal(result, 'resolved 2');
    });

    it('Should remove shift item 2 from stack', () => {
        let current = stack._stack.length;
        assert.equal(current, length - 2);
    });

    it('Should move to next rejected item return this item (shift), and ignore previous  resolved items', () => {
        let item = stack.next(SpecializedStackItemType.onRejected);
        let result = item.fn();
        assert.equal(result, 'rejected 1');
    });

    it('Should remove rejected item (shift) from stack', () => {
        let current = stack._stack.length;
        assert.equal(current, length - 4);
    });

    it('Should move to next rejected item return this item (shift)', () => {
        let item = stack.next(SpecializedStackItemType.onRejected);
        let result = item.fn();
        assert.equal(result, 'rejected 2');
    });

    it('Should remove rejected item 2 (shift) from stack', () => {
        let current = stack._stack.length;
        assert.equal(current, length - 5);
    });

    it('Should move to next resolved item and return undefined', () => {
        let item = stack.next(SpecializedStackItemType.onResolved);
        assert.equal(item, undefined);
    });

    it('Should have clear the stack', () => {
        let current = stack._stack.length;
        assert.equal(current, 0);
    });

});

