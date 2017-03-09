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

    it('Should push an item', (done) => {
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

    it('Should push items', (done) => {
        let ev = [];
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            ev.push({ event, value, index });
            if (ev.length === 3) {
                assert.equal(ev[0].event, 'added');
                assert.equal(ev[1].event, 'added');
                assert.equal(ev[2].event, 'added');
                assert.equal(ev[0].value, 'c');
                assert.equal(ev[1].value, 'd');
                assert.equal(ev[2].value, 'e');
                assert.equal(ev[0].index, 2);
                assert.equal(ev[1].index, 3);
                assert.equal(ev[2].index, 4);
                done();
            }
        });
        items.push('c', 'd', 'e');
    });

    it('Should insert (unshift) an item', (done) => {
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'added');
            assert.equal(value, 'c');
            assert.equal(index, 0);
            done();
        });
        items.unshift('c');
    });


    it('Should insert (unshift) items', (done) => {
        let ev = [];
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            ev.push({ event, value, index });
            if (ev.length === 3) {
                assert.equal(ev[0].event, 'added');
                assert.equal(ev[1].event, 'added');
                assert.equal(ev[2].event, 'added');
                assert.equal(ev[0].value, 'c');
                assert.equal(ev[1].value, 'd');
                assert.equal(ev[2].value, 'e');
                assert.equal(ev[0].index, 0);
                assert.equal(ev[1].index, 0);
                assert.equal(ev[2].index, 0);
                done();
            }
        });
        items.unshift('c', 'd', 'e');
    });

    it('Should remove an item (splice)', (done) => {
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

    it('Should remove items (splice)', (done) => {
        let ev = [];
        let items = ['a', 'b', 'c', 'd'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            ev.push({ event, value, index });
            if (ev.length === 2) {
                assert.equal(ev[0].event, 'removed');
                assert.equal(ev[1].event, 'removed');
                assert.equal(ev[0].value, 'b');
                assert.equal(ev[1].value, 'c');
                assert.equal(items.length, 2);
                assert.equal(items[0], 'a');
                assert.equal(items[1], 'd');
                done();
            }
        });
        items.splice(1, 2);
    });

    it('Should insert items (splice)', (done) => {
        let ev = [];
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            ev.push({ event, value, index });
            if (ev.length === 3) {
                assert.equal(ev[0].event, 'removed');
                assert.equal(ev[1].event, 'added');
                assert.equal(ev[2].event, 'added');
                assert.equal(ev[0].value, 'b');
                assert.equal(ev[1].value, 'c');
                assert.equal(ev[2].value, 'd');
                assert.equal(items.length, 3);
                assert.equal(items[0], 'a');
                assert.equal(items[1], 'c');
                assert.equal(items[2], 'd');
                done();
            }
        });
        items.splice(1, 1, 'c', 'd');
    });

    it('Should shift', (done) => {
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'removed');
            assert.equal(value, 'a');
            assert.equal(index, 0);
            done();
        });
        items.shift();
    });

    it('Should pop', (done) => {
        let items = ['a', 'b'];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'removed');
            assert.equal(value, 'b');
            assert.equal(index, 1);
            done();
        });
        items.pop();
    });

    it('Should sort', (done) => {
        let items = [1, 3, 2];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'sorted');
            assert.equal(value[0], 1);
            assert.equal(value[1], 2);
            assert.equal(value[2], 3);
            done();
        });
        items.sort();
    });

    it('Should filter', (done) => {
        let items = [1, 3, 2];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            assert.equal(event, 'filtered');
            assert.equal(value[0], 1);
            assert.equal(value[1], 2);
            assert.equal(value.length, 2);
            done();
        });
        items.filter((item) => {
            return item < 3;
        });
    });

    it('Should reset filter', (done) => {
        let isFiltered = false;
        let items: any = [1, 3, 2];
        let o = new ObservableArray(items);
        o.subscribe((event, value, index) => {
            if (!isFiltered) {
                isFiltered = true;
                items.resetFilter();
            }
            else {
                assert.equal(event, 'filtered');
                assert.equal(value[0], 1);
                assert.equal(value[1], 3);
                assert.equal(value[2], 2);
                assert.equal(items.length, 3);
                done();
            }
        });
        items.filter((item) => {
            return item < 3;
        });
    });
});
