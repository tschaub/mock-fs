const fs = require('fs');
const path = require('path');

const rimraf = require('rimraf');

const tmpPath = '.tmp';

/**
 * Test setup.  Not timed.
 * @param {function(Error):void} done Callback.
 */
exports.afterEach = function (done) {
  rimraf(tmpPath, done);
};

/**
 * Test teardown.  Not timed.
 * @param {function(Error):void} done Callback.
 */
exports.beforeEach = function (done) {
  fs.mkdir(tmpPath, done);
};

/**
 * Timed test.
 * @param {function(Error):void} done Callback.
 */
exports.test = function (done) {
  fs.writeFile(path.join(tmpPath, 'foo-real.txt'), 'foo', done);
};
