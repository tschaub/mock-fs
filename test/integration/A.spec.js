/**
 * This test is here so that fs-extra is required before mock-fs in the
 * B.spec.js file.
 *
 * See https://github.com/tschaub/mock-fs/issues/103
 */

var assert = require('../helper').assert;
var fs = require('fs-extra');

describe('Dummy test A', function() {
  it('should pass', function() {
    assert.equal(typeof fs, 'object');
  });
});
