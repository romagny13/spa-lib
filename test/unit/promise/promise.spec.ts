import { assert } from 'chai';
import { TSPromise } from '../../../src/promise/promise';
import { TSPromiseArray } from '../../../src/promise/promise.array';

describe('TSPromise and TSPromise all', () => {

    describe('TSPromise', () => {

       it('Should resolve (resolve => then)', (done) => {
            let r = 'p1 resolved';

            let p1 = new TSPromise((resolve, reject) => {
                resolve(r);
            });

            setTimeout(() => {
                p1.then((result) => {
                    assert.equal(result, r);
                    done();
                }, (reason) => {
                    assert.fail();
                });
            }, 500);
        });

        it('Should resolve with on resolve timeout (then => resolve)', (done) => {
            let r = 'p1 resolved';

            let p1 = new TSPromise((resolve, reject) => {
                setTimeout(() => {
                    resolve(r);
                }, 1000);
            });

            p1.then((result) => {
                assert.equal(result, r);
                done();
            }, (reason) => {
                assert.fail();
            });
        });


        it('Should reject (reject => then)', (done) => {
            let r = 'p1 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                reject(r);
            });

            setTimeout(() => {
                p1.then((result) => {
                    assert.fail();
                }, (reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });
       

        it('Should reject on reject timeout (then => reject)', (done) => {
            let r = 'p1 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                setTimeout(() => {
                    reject(r);
                }, 1000);
            });

            p1.then((result) => {
                assert.fail();
            }, (reason) => {
                assert.equal(reason, r);
                done();
            });

        }); 

       it('Should reject (reject => then) with catch', (done) => {
            let r = 'p1 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                reject(r);
            });

            setTimeout(() => {
                p1.then((result) => {
                    assert.fail();
                }).catch((reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });

       it('Should reject on reject timeout (then => reject) with catch', (done) => {
            let r = 'p1 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                setTimeout(() => {
                    reject(r);
                }, 1000);
            });

            p1.then((result) => {
                assert.fail();
            }).catch((reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should chain resolved promise', (done) => {
            let r = 'return result from first promise';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                return r;
            }, (reason) => {
                assert.fail();
            }).then((result) => {
                assert.equal(result, r);
                done();
            });
        });


        it('Should catch throwed exception from promise', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                throw r;
            });

            p1.then((result) => {
                assert.fail();
            }, (reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should catch throwed exception from promise with catch', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                throw r;
            });

            p1.then((result) => {
                assert.fail();
            }).catch((reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should catch throwed exception from then', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                throw r;
            }).then(() => { }, (reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should catch throwed exception from then with catch', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                throw r;
            }).then((result) => {
                assert.fail();
            }).catch((reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should catch throwed exception from chained promise', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                return result;
            }).then((result) => {
                throw r;
            }).then((result) => {
                assert.fail();
            }, (reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should catch throwed exception from chained promise with catch', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                return result;
            }).then((result) => {
                throw r;
            }).then((result) => {
                assert.fail();
            }).catch((reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should chain chatched exption with catch', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                throw r;
            }).catch((reason) => {
                throw reason;
            }).catch((reason) => {
                assert.equal(reason, r);
                done();
            });
        });

        it('Should chain multiple resolved promises', (done) => {
            let count = 0;

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                // console.log('promise 1', 'count:', count, 'result:', result);
                count++;
                return count;
            }, (reason) => {
                assert.fail();
            }).then((result) => {
                //  console.log('promise 2', 'count:', count, 'result:', result);
                count++;
                return count;
            }).then((result) => {
                // console.log('promise 3', 'count:', count, 'result:', result);
                count++;
                return count;
            }).then((result) => {
                // console.log('promise 4', 'count:', count, 'result:', result);
                assert.equal(result, count);
                done();
            });
        });

        it('Should chain multiple throw exceptions', (done) => {
            let count = 0;
            let r = 'error';
            let p1 = new TSPromise((resolve, reject) => {
                throw r;
            });

            p1.then((result) => {
                assert.fail();
            }, (reason) => {
                // console.log('promise 1', 'count:', count, 'result:', reason);
                count++;
                throw reason;
            }).then((result) => {
                assert.fail();
            }, (reason) => {
                // console.log('promise 2', 'count:', count, 'result:', reason);
                count++;
                throw reason;
            }).then((result) => {
                assert.fail();
            }, (reason) => {
                // console.log('promise 3', 'count:', count, 'result:', reason);
                count++;
                throw reason;
            }).then((result) => {
                assert.fail();
            }, (reason) => {
                // console.log('promise 3', 'count:', count, 'result:', reason);
                assert.equal(reason, r);
                assert.equal(count, 3);
                done();
            });
        });


        it('Should chain multiple throw exceptions with catch', (done) => {
            let count = 0;
            let r = 'error';
            let p1 = new TSPromise((resolve, reject) => {
                throw r;
            });

            p1.then((result) => {
                assert.fail();
            }).catch((reason) => {
               // console.log('promise 1', 'count:', count, 'result:', reason);
                count++;
                throw reason;
            }).then((result) => {
                assert.fail();
            }).catch((reason) => {
               // console.log('promise 2', 'count:', count, 'result:', reason);
                count++;
                throw reason;
            }).then((result) => {
                assert.fail();
            }).catch((reason) => {
                // console.log('promise 3', 'count:', count, 'result:', reason);
                count++;
                throw reason;
            }).then((result) => {
                assert.fail();
            }).catch((reason) => {
               // console.log('promise 3', 'count:', count, 'result:', reason);
                assert.equal(reason, r);
                assert.equal(count, 3);
                done();
            });
        });

       it('Should return result after exception', (done) => {
            let r = 'ok';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('p1 resolved');
            });

            p1.then((result) => {
                throw 'error';
            }).then((result) => {
                assert.fail();
            }, (reason) => {
                return r;
            }).then((result) => {
                assert.equal(result, r);
                done();
            }, (reason) => {
                assert.fail();
            });
        });

    });

    describe('All', () => {

        it('Should resolve (resolve => then)', (done) => {
            let r = 'p1 resolved',
                r2 = 'p2 resolved';

            let p1 = new TSPromise((resolve, reject) => {
                resolve(r);
            });

            let p2 = new TSPromise((resolve, reject) => {
                resolve(r2);
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.equal(result[0], r);
                    assert.equal(result[1], r2);
                    done();
                }, (reason) => {
                    assert.fail();
                });
            }, 500);
        });

     it('Should resolve with on resolve timeout (then => resolve)', (done) => {
            let r = 'p1 resolved',
                r2 = 'p2 resolved';


            let p1 = new TSPromise((resolve, reject) => {
                setTimeout(function () {
                    resolve(r);
                }, 800);
            });

            let p2 = new TSPromise((resolve, reject) => {
                setTimeout(function () {
                    resolve(r2);
                }, 1000);
            });

            TSPromise.all([p1, p2]).then((result) => {
                assert.equal(result[0], r);
                assert.equal(result[1], r2);
                done();
            }, (reason) => {
                assert.fail();
            });
        });

        it('Should reject at first promise (reject => then)', (done) => {
            let r = 'p1 rejected',
                r2 = 'p2 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                reject(r);
            });

            let p2 = new TSPromise((resolve, reject) => {
                reject(r2);
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.fail();
                }, (reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });

        it('Should reject at second promise (reject => then)', (done) => {
            let r = 'p1 resolved',
                r2 = 'p2 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                resolve(r);
            });

            let p2 = new TSPromise((resolve, reject) => {
                reject(r2);
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.fail();
                }, (reason) => {
                    assert.equal(reason, r2);
                    done();
                });
            }, 500);
        });

        it('Should reject (reject => then) with catch', (done) => {
            let r = 'p1 rejected',
                r2 = 'p2 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                reject(r);
            });

            let p2 = new TSPromise((resolve, reject) => {
                reject(r2);
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.fail();
                }).catch((reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });

        it('Should reject at first promise on timeout (then => reject)', (done) => {
            let r = 'p1 rejected',
                r2 = 'p2 rejected';

            let p1 = new TSPromise((resolve, reject) => {
                setTimeout(function () {
                    reject(r);
                }, 1000);
            });

            let p2 = new TSPromise((resolve, reject) => {
                reject(r2);
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.fail();
                }, (reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });

        it('Should chain resolved promise', (done) => {
            let r = 'return result';
            let p1 = new TSPromise((resolve, reject) => {
                resolve('r1 resolved');
            });

            let p2 = new TSPromise((resolve, reject) => {
                resolve('r2 resolved');
            });

            TSPromise.all([p1, p2]).then((result) => {
                return r;
            }, (reason) => {
                assert.fail();
            }).then((result) => {
                assert.equal(result, r);
                done();
            });
        });


        it('Should catch exception in promise', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                throw r;
            });

            let p2 = new TSPromise((resolve, reject) => {
                resolve('p2 resolved');
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.fail();
                }).catch((reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });


        it('Should catch exception in then', (done) => {
            let r = 'error';

            let p1 = new TSPromise((resolve, reject) => {
                resolve('r1 resolved');
            });

            let p2 = new TSPromise((resolve, reject) => {
                resolve('p2 resolved');
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    throw r;
                }, (reason) => {
                    assert.fail();
                }).then((result) => {
                    assert.fail();
                }, (reason) => {
                    assert.equal(reason, r);
                    done();
                });
            }, 500);
        });

        it('Should chain exception with catch', (done) => {
            let r = 'error';
            let count = 0;

            let p1 = new TSPromise((resolve, reject) => {
                throw r;
            });

            let p2 = new TSPromise((resolve, reject) => {
                resolve('p2 resolved');
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.fail();
                }).catch((reason) => {
                    count++;
                    throw r;
                }).then((result) => {
                    assert.fail();
                }).catch((reason) => {
                    assert.equal(reason, r);
                    assert.equal(count, 1);
                    done();
                });
            }, 500);
        });

        it('Should notify', (done) => {
            let r = 'r1 resolved',
                r2 = 'r2 resolved',
                arr = [];

            let p1 = new TSPromise((resolve, reject) => {
                resolve(r);
            });

            let p2 = new TSPromise((resolve, reject) => {
                resolve(r2);
            });

            setTimeout(() => {
                TSPromise.all([p1, p2]).then((result) => {
                    assert.equal(arr.length, 2);
                    assert.equal(arr[0], r);
                    assert.equal(arr[1], r2);
                    done();
                }, () => {
                    assert.fail();
                }, (current) => {
                    // console.log('notify',current);
                    arr.push(current);
                });
            }, 500);
        });

        describe('Race', () => {

            it('Should Resolve first promise resolved', (done) => {
                let r = 'r3 resolved';

                let p1 = new TSPromise((resolve, reject) => {
                    setTimeout(function () {
                        resolve('r1 resolved');
                    }, 1000);
                });

                let p2 = new TSPromise((resolve, reject) => {
                    setTimeout(function () {
                        resolve('r2 resolved');
                    }, 1200);
                });

                let p3 = new TSPromise((resolve, reject) => {
                    setTimeout(function () {
                        resolve(r);
                    }, 400);
                });

                setTimeout(() => {
                    TSPromise.race([p1, p2, p3]).then((result) => {
                        assert.equal(result.length, 1);
                        assert.equal(result[0], r);
                        done();
                    }, () => {
                        assert.fail();
                    });
                }, 500);

            });
        });

        describe('Manual', () => {

            it('Should Reject', (done) => {

                let r = 'p1 rejected';

                function f1(condition) {
                    let promise = new TSPromise();
                    if (condition) { promise.resolve('p1 resolved'); }
                    else { promise.reject(r); }
                    return promise;
                }

                let p1 = f1(false);
                p1.then((result) => {
                    assert.fail();
                }, (reason) => {
                    assert.equal(reason, r);
                    done();
                });

            });
        });

    });
});