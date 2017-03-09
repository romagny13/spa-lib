import { assert } from 'chai';
import { Http, HttpResponse, sendRequest } from '../../../src/http/index';
import { HttpRequest } from '../../../src/http/request';

/*

 Ajax/ Rest
 Should GET
 Should Post
 Should Put
 Should delete
 Should load
 Allow to intercept before
 Allow to intercept after
Rest
Allow to send with access_token

  */

describe('Http', () => {
    let http = new Http();
    const baseUrl = 'http://jsonplaceholder.typicode.com';

    it('Should send', (done) => {
        const request = new HttpRequest({ url: `${baseUrl}/posts` });
        sendRequest(request, (response: HttpResponse) => {
            let posts = JSON.parse(response.body);
            // console.log(response, posts);
            assert.isTrue(posts.length > 0);
            done();
        });
    });

    it('Should load', (done) => {
        http.load('http://res.cloudinary.com/romagny13/raw/upload/v1483220902/mytemplate_pjynru.html', (template) => {
            assert.equal(template, '<h1>My template</h1>\n');
            done();
        });
    });

    it('Should send with http', (done) => {
        const request = new HttpRequest({ url: `${baseUrl}/posts` });
        http.send(request).then((response: HttpResponse) => {
            let posts = JSON.parse(response.body);
            assert.isTrue(posts.length > 0);
            done();
        });
    });

    it('Should get with get function', (done) => {
        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            let posts = JSON.parse(response.body);
            assert.isTrue(posts.length > 0);
            done();
        });
    });

    it('Should have an error on invalid url', (done) => {
        const request = new HttpRequest({ url: `${baseUrl}/n_o_t_f_o_u_n_d` });
        http.send(request).then((response) => {
            console.log('success', response);
            assert.fail();
        }, (response) => {
            assert.equal(response.status, 404);
            done();
        });
    });

    it('Should get response type', (done) => {
        const request = new HttpRequest({ url: 'http://res.cloudinary.com/romagny13/image/upload/v1464052663/dotnet_oh0ryu.png', responseType: 'blob' });
        http.send(request).then((response: HttpResponse) => {
            assert.isNotNull(response.body);
            assert.isTrue(response.body instanceof Blob);
            done();
        });
    });

    it('Should post with json', function (done) {
        const data = {
            title: 'My json article',
            body: 'lorem ipsum ...'
        };
        http.post(`${baseUrl}/posts`, JSON.stringify(data)).then((response: HttpResponse) => {
            let post = JSON.parse(response.body);
            assert.equal(data.title, post.title);
            assert.equal(response.status, 201);
            done();
        });
    });

    it('Should post with form', function (done) {
        let body = 'title=' + encodeURIComponent('My form article') + '&content=' + encodeURIComponent('my content');
        const request = new HttpRequest({
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            url: `${baseUrl}/posts`,
            body
        });
        http.send(request).then((response: HttpResponse) => {
            let post = JSON.parse(response.body);
            assert.equal(post.title, 'My form article');
            assert.equal(response.status, 201);
            done();
        });
    });

    it('post form data', function (done) {
        let data = new FormData();
        data.append('id', '1002');
        data.append('title', 'My form data article');
        data.append('content', 'my content');

        const request = new HttpRequest({
            method: 'POST',
            url: `${baseUrl}/posts`,
            body: data
        });
        http.send(request).then((response: HttpResponse) => {
            let post = JSON.parse(response.body);
            assert.equal(response.status, 201);
            done();
        });
    });

    it('Should handle timeout', function (done) {
        const request = new HttpRequest({
            url: `${baseUrl}/posts`,
            timeout: 1
        });
        http.send(request).then(() => {
            assert.fail();
        }, (response: HttpResponse) => {
            assert.equal(response.status, 0);
            assert.isOk('Ok');
            done();
        });
    });

    it('Should handle error (cors for example)', function (done) {
        const request = new HttpRequest({
            url: 'https://developer.mozilla.org/',
            timeout: 1
        });
        http.send(request).then(() => {
            assert.fail();
        }, (response: HttpResponse) => {
            assert.equal(response.status, 0);
            assert.isOk('Ok');
            done();
        });
    });

    /* pb PhantomJS
        it('Should handle abort', function (done) {
            const request = new HttpRequest({
                url: `${baseUrl}/posts`
            });
            http.send(request).then(() => {
                assert.fail();
            }, (response: HttpResponse) => {
                assert.equal(response.status, 0);
                assert.isOk('Ok');
                done();
            });
            request.abort();
        });
        */

    it('Should handle progress', function (done) {
        let events = [];
        const request = new HttpRequest({
            url: `${baseUrl}/posts`,
            progress: (event) => {
                events.push(event);
            }
        });
        http.send(request).then(() => {
            assert.isTrue(events.length > 0);
            assert.isNotNull(events[0]);
            done();
        }, (response: HttpResponse) => {
            assert.fail();
        });
    });

    it('Should put with json', function (done) {
        const data = {
            id: 1,
            title: 'My json article',
            content: 'lorem ipsum ...'
        };
        http.put(`${baseUrl}/posts/1`, JSON.stringify(data)).then((response: HttpResponse) => {
            let post = JSON.parse(response.body);
            assert.equal(data.title, post.title);
            assert.equal(response.status, 200);
            done();
        });
    });

    it('Should delete', function (done) {
        http.delete(`${baseUrl}/posts/1`).then((response: HttpResponse) => {
            assert.equal(response.status, 200);
            done();
        });
    });

    it('Should intercept', function (done) {
        let hasInterceptedBefore = false,
            hasInterceptedAfter = false;

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter = true;
                next(true);
            }
        });

        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            assert.isTrue(hasInterceptedBefore);
            assert.isTrue(hasInterceptedAfter);
            http.interceptors = [];
            done();
        });
    });

    it('Should intercept before and cancel', function (done) {
        let hasInterceptedBefore = false,
            hasInterceptedAfter = false;

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore = true;
                next(false);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter = true;
                next(true);
            }
        });

        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            assert.fail();
        }).catch(() => {
            assert.isTrue(hasInterceptedBefore);
            assert.isFalse(hasInterceptedAfter);
            http.interceptors = [];
            done();
        });
    });

    it('Should intercept after and cancel', function (done) {
        let hasInterceptedBefore = false,
            hasInterceptedAfter = false;

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter = true;
                next(false);
            }
        });

        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            assert.fail();
        }).catch(() => {
            assert.isTrue(hasInterceptedBefore);
            assert.isTrue(hasInterceptedAfter);
            http.interceptors = [];
            done();
        });
    });

    it('Should eval all interceptors', function (done) {
        let hasInterceptedBefore = false,
            hasInterceptedAfter = false,
            hasInterceptedBefore2 = false,
            hasInterceptedAfter2 = false;

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter = true;
                next(true);
            }
        });

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore2 = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter2 = true;
                next(true);
            }
        });

        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            assert.isTrue(hasInterceptedBefore);
            assert.isTrue(hasInterceptedAfter);
            assert.isTrue(hasInterceptedBefore2);
            assert.isTrue(hasInterceptedAfter2);
            http.interceptors = [];
            done();
        });
    });

    it('Should cancel before with interceptors', function (done) {
        let hasInterceptedBefore = false,
            hasInterceptedAfter = false,
            hasInterceptedBefore2 = false,
            hasInterceptedAfter2 = false;

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore = true;
                next(false);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter = true;
                next(true);
            }
        });

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore2 = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter2 = true;
                next(true);
            }
        });

        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            assert.fail();
        }).catch(() => {
            assert.isTrue(hasInterceptedBefore);
            assert.isFalse(hasInterceptedAfter);
            assert.isFalse(hasInterceptedBefore2);
            assert.isFalse(hasInterceptedAfter2);
            http.interceptors = [];
            done();
        });
    });

    it('Should cancel after with interceptors', function (done) {
        let hasInterceptedBefore = false,
            hasInterceptedAfter = false,
            hasInterceptedBefore2 = false,
            hasInterceptedAfter2 = false;

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter = true;
                next(false);
            }
        });

        http.interceptors.push({
            before(request: HttpRequest, next: Function) {
                hasInterceptedBefore2 = true;
                next(true);
            },
            after(response: HttpResponse, next: Function) {
                hasInterceptedAfter2 = true;
                next(true);
            }
        });

        http.get(`${baseUrl}/posts`).then((response: HttpResponse) => {
            assert.fail();
        }).catch(() => {
            assert.isTrue(hasInterceptedBefore);
            assert.isTrue(hasInterceptedAfter);
            assert.isTrue(hasInterceptedBefore2);
            assert.isFalse(hasInterceptedAfter2);
            http.interceptors = [];
            done();
        });
    });


});