const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rimraf = require('rimraf');

const tmpPath = '.tmp';

/**
 * Test setup.  Not timed.
 * @param {function(Error)} done Callback.
 */
exports.beforeEach = function (done) {
  fs.mkdir(tmpPath, function (err) {
    if (err) {
      return done(err);
    }
    fs.writeFile(path.join(tmpPath, 'foo-real.txt'), 'foo', done);
  });
};

/**
 * Timed test.
 * @param {function(Error)} done Callback.
 */
exports.test = function (done) {
  fs.readFile(path.join(tmpPath, 'foo-real.txt'), 'utf8', function (err, str) {
    assert.ifError(err);
    assert.equal(str, 'foo');
    done();
  });
};

/**
 * Test teardown.  Not timed.
 * @param {function(Error)} done Callback.
 */
exports.afterEach = function (done) {
  rimraf(tmpPath, done);
};
