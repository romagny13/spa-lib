import { assert } from 'chai';
import { Messenger } from '../../../src/messenger/messenger';

/*
 Should subscribe
 Should publish
 Should receive parameters
 All subscribers are notified
 Should unsubscribe
 Should clear

 */

describe('Messenger', () => {
    let messenger = new Messenger();
    let subscriber;
    function onMessage(r, r2, r3) {
        if (subscriber) { subscriber(r, 2, r3); }
    }

    it('Should subscribe', () => {
        let k = 'k1';
        messenger.subscribe(k, onMessage);
        assert.isTrue(messenger.isRegistered(k));
    });

    it('Should notify', (done) => {
        let k = 'k1';
        let result1 = 'message 1';
        let result2 = 'message 2';
        let result3 = 'message 3';
        subscriber = (r, r2, r3) => {
            assert.equal(r, result1);
            done();
        };
        messenger.publish(k, result1, result2, result3);
    });

    it('Should unsubscribe', () => {
        let k = 'k1';
        assert.isTrue(messenger.unsubscribe(k, onMessage));
        assert.equal(messenger.getSubscribers(k).length, 0);
    });

    it('All subscribers are notified', (done) => {
        let k = 'k2';
        let value = 'message 2';
        let count = 0;
        messenger.subscribe(k, (r) => {
            count++;
            assert.equal(r, value);
            if (count === 2) { done(); }
        });
        messenger.subscribe(k, (r) => {
            count++;
            assert.equal(r, value);
            if (count === 2) { done(); }
        });
        messenger.publish(k, value);
    });

    it('Should unsubscribe all subscribers', () => {
        let k = 'k2';
        assert.equal(messenger.getSubscribers(k).length, 2);
        assert.isTrue(messenger.unsubscribe(k));
        assert.isUndefined(messenger.getSubscribers(k));
    });

});

