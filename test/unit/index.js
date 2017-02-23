var P = require('es6-promise').Promise;
window.Promise = window.Promise ? window.Promise : P;

require('./storage/cookie.service.spec');
require('./storage/storage.service.spec');
/* problem with Phantomjs
require('./storage/indexeddb.service.spec'); */
require('./cache/cache.spec');
require('./messenger/messenger.spec');
require('./http/http.spec');
require('./observables/observable.spec');
require('./form/form.spec');
require('./promise/stack.spec');
require('./promise/promise.spec');
