/* eslint-env mocha */
'use strict';

var mock = require('../../lib/index');
var assert = require('../helper').assert;

var count = require('./filecount');

describe('count(dir, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/dir': {
        'one.txt': 'first file',
        'two.txt': 'second file',
        'empty-dir': {},
        'another-dir': {
          'another.txt': 'more files'
        }
      }
    });
  });
  afterEach(mock.restore);

  it('counts files in a directory', function(done) {
    count('path/to/dir', function(err, num) {
      if (err) {
        return done(err);
      }
      assert.equal(num, 2);
      done();
    });
  });

  it('counts files in another directory', function(done) {
    count('path/to/dir/another-dir', function(err, num) {
      if (err) {
        return done(err);
      }
      assert.equal(num, 1);
      done();
    });
  });

  it('counts files in an empty directory', function(done) {
    count('path/to/dir/empty-dir', function(err, num) {
      if (err) {
        return done(err);
      }
      assert.equal(num, 0);
      done();
    });
  });

  it('fails for bogus path', function(done) {
    count('path/to/dir/bogus', function(err, num) {
      assert.instanceOf(err, Error);
      assert.isUndefined(num);
      done();
    });
  });
});
