import { assert } from 'chai';
import { Observable, ObservableArray } from '../../../src/observables';

/*

*/

describe('Observable', () => {

    it('Should notify on value changed', (done) => {
        const vm = {
            myString: 'my value'
        };

        function onValueChanged(value) {
            assert.equal(value, 'new value');
            done();
        }
        let o = new Observable(vm, 'myString');
        o.subscribe(onValueChanged);

        vm.myString = 'new value';
    });


    it('Should unsubscribe', (done) => {
        let count = 0;
        const vm = {
            myString: 'my value'
        };

        function onValueChanged(value) {
            count++;
        }
        let o = new Observable(vm, 'myString');
        o.subscribe(onValueChanged);
        vm.myString = 'new value';
        setTimeout(() => {
            o.unsubscribe(onValueChanged);
            vm.myString = 'new value 2';
            setTimeout(() => {
                o.subscribe(onValueChanged);
                vm.myString = 'new value 3';
                setTimeout(() => {
                    assert.equal(count, 2);
                    done();
                }, 500);
            }, 500);
        }, 500);
    });


    it('ObservableArray notify on item added', (done) => {
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'added');
            assert.equal(value, 'c');
            assert.equal(index, 2);
            done();
        });
        items.push('c');
    });


    it('ObservableArray notify on item removed', (done) => {
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'removed');
            assert.equal(value, 'b');
            assert.equal(index, 1);
            done();
        });
        items.splice(1, 1);
    });


    it('unobserve array', (done) => {
        let count = 0;
        let items = ['a', 'b'];
        function onNotify(event, value, index) {
            count++;
        }
        let o = new ObservableArray(items);
        o.subscribe(onNotify);
        items.push('c');
        setTimeout(() => {
            o.unsubscribe(onNotify);
            items.push('d');
            setTimeout(() => {
                o.subscribe(onNotify);
                items.push('e');
                setTimeout(() => {
                    // console.log(items, o)
                    assert.equal(count, 2);
                    done();
                }, 500);
            }, 500);
        }, 500);
    });

});
