const assert = require('assert');
const fs = require('fs');

const mock = require('..');

/**
 * Timed test.  This includes the mock setup and teardown as part of the overall
 * test time.
 * @param {function(Error)} done Callback.
 */
exports.test = function (done) {
  mock();

  fs.writeFile('foo-mock.txt', 'foo', function (err) {
    assert.ifError(err);

    mock.restore();
    done();
  });
};
