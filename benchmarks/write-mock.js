const fs = require('fs');
const mock = require('../lib/index.js');

/**
 * Test setup.  Not timed.
 */
exports.afterEach = function () {
  mock.restore();
};

/**
 * Test teardown.  Not timed.
 */
exports.beforeEach = function () {
  mock();
};

/**
 * Timed test.
 * @param {function(Error):void} done Callback.
 */
exports.test = function (done) {
  fs.writeFile('foo-mock.txt', 'foo', done);
};
