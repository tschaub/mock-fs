const assert = require('assert');
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
  mock({
    'foo-mock.txt': 'foo',
  });
};

/**
 * Timed test.
 * @param {function(Error):void} done Callback.
 */
exports.test = function (done) {
  fs.readFile('foo-mock.txt', 'utf8', function (err, str) {
    assert.ifError(err);
    assert.equal(str, 'foo');
    done();
  });
};
