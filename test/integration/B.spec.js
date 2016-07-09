/**
 * The A.spec.js file requires fs-extra before this one.  Here we confirm that
 * mock-fs still works even if fs-extra was required elsewhere first.
 *
 * See https://github.com/tschaub/mock-fs/issues/103
 */

var assert = require('../helper').assert;
var mock = require('../../lib/index');
var fs = require('fs-extra');

describe('Dummy test B', function() {
  before(function() {
    mock({
      folder: {}
    });
  });

  after(function() {
    mock.restore();
  });

  it('should read mocked directory', function() {
    var content = fs.readdirSync('folder');
    assert.isArray(content);
  });

});
