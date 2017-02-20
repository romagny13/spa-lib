import { assert } from 'chai';
import { IndexedDBService } from '../../../src/storage';

/*
Should create and open a database with a db model
Allow to add data
Allow to update data
Allow to remove data
Allow to read one
Allow to read a list
Allow to count
Should delete db
*/

describe('IndexedDbService', () => {

    const dbConfigs = [{
        name: 'testdb',
        created: true,
        objectStores: [{
            name: 'users',
            key: { keyPath: 'id', autoIncrement: true },
            indexes: [{ name: 'username', definition: { unique: false } }]
        }]
    }];
    const indexeddbService = new IndexedDBService(dbConfigs);

    it('Should open create a database with a db model', (done) => {
        let created = false;
        indexeddbService.openCreateDb('testdb', 1).then((result) => {
            assert.isOk('Db opened');
            assert.isNotNull(result);
            done();
        }, function (e) {
            assert.fail();
        });
    });

    it('Should insert data', (done) => {
        indexeddbService.insert('users', { userName: 'marie' }).then((result) => {
            assert.isOk('User created');
            done();
        }, () => {
            assert.fail();
        });
    });

    it('Should insert data with promise all', (done) => {
        let user1 = {
            name: 'user1'
        };
        let user2 = {
            name: 'user2'
        };
        let p1 = indexeddbService.insert('users', user1);
        let p2 = indexeddbService.insert('users', user2);
        Promise.all([p1, p2]).then((result) => {
            assert.isOk('Users created');
            done();
        }, function (e) {
            assert.fail();
        });
    });

    it('Should get one', (done) => {
        indexeddbService.getOne('users', 1).then((result) => {
            assert.equal(result['userName'], 'marie');
            done();
        }, () => {
            assert.fail();
        });
    });

    it('Should get all', (done) => {
        indexeddbService.getAll('users').then((result: any[]) => {
            assert.equal(result[1].name, 'user1');
            assert.equal(result[2].name, 'user2');
            assert.equal(result.length, 3);
            done();
        }, () => {
            assert.fail();
        });
    });

    it('Should count', (done) => {
        indexeddbService.count('users').then((result) => {
            assert.equal(result, 3);
            done();
        }, () => {
            assert.fail();
        });
    });

    it('Should update', (done) => {
        let user = {
            userName: 'updated'
        };
        indexeddbService.update('users', 1, user).then((result) => {
            assert.equal(result['userName'], 'updated');
            done();
        }, function (e) {
            assert.fail();
        });

    });

    it('Should delete', (done) => {
        indexeddbService.delete('users', 1).then((result) => {
            assert.isOk('deleted');
            done();
        }, () => {
            assert.fail();
        });
    });

    it('Catch exception', (done) => {
        indexeddbService.delete('notfound', 1).then((result) => {
            assert.fail();
        }, function (e) {
            assert.isOk('catch exception');
            done();
        });
    });

    it('Should delete db', (done) => {
        indexeddbService.deleteDb('testdb').then((result) => {
            assert.isOk('db deleted');
            done();
        }, function (e) {
            assert.fail();
        });
    });

});