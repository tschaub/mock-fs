const assert = require('assert');
const fs = require('fs');

const mock = require('..');

/**
 * Timed test.  This includes the mock setup and teardown as part of the overall
 * test time.
 * @param {function(Error)} done Callback.
 */
exports.test = function (done) {
  mock({
    'foo-mock.txt': 'foo',
  });

  fs.readFile('foo-mock.txt', 'utf8', function (err, str) {
    assert.ifError(err);
    assert.equal(str, 'foo');

    mock.restore();
    done();
  });
};
