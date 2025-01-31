const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const tmpPath = '.tmp';

/**
 * Timed test.  This includes the setup and teardown as part of the overall
 * test time.
 * @param {function(Error):void} done Callback.
 */
exports.test = function (done) {
  fs.mkdir(tmpPath, function (mkdirErr) {
    assert.ifError(mkdirErr);
    const tmpFile = path.join(tmpPath, 'foo-real.txt');
    fs.writeFile(tmpFile, 'foo', function (writeErr) {
      assert.ifError(writeErr);
      fs.readFile(tmpFile, 'utf8', function (readErr, str) {
        assert.ifError(readErr);
        assert.equal(str, 'foo');
        rimraf(tmpPath, done);
      });
    });
  });
};
