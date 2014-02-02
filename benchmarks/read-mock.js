var assert = require('assert');
var fs = require('fs');

var mock = require('..');


/**
 * Test setup.  Not timed.
 * @param {function(Error)} done Callback.
 */
exports.beforeEach = function(done) {
  mock({
    'foo-mock.txt': 'foo'
  });
  done();
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
 * @param {function(Error)} done Callback.
 */
exports.afterEach = function(done) {
  mock.restore();
  done();
};
