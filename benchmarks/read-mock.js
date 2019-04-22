const assert = require('assert');
const fs = require('fs');

const mock = require('..');

/**
 * Test setup.  Not timed.
 */
exports.beforeEach = function() {
  mock({
    'foo-mock.txt': 'foo'
  });
};

/**
 * Timed test.
 * @param {function(Error)} done Callback.
 */
exports.test = function(done) {
  fs.readFile('foo-mock.txt', 'utf8', function(err, str) {
    assert.ifError(err);
    assert.equal(str, 'foo');
    done();
  });
};

/**
 * Test teardown.  Not timed.
 */
exports.afterEach = function() {
  mock.restore();
};
