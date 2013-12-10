var rewire = require('rewire');

var mock = require('../../lib/index');
var assert = require('../helper').assert;

var count = rewire('./filecount');

var fs = mock.fs();
count.__set__('fs', fs);

describe('count(dir, callback)', function() {

  beforeEach(function() {
    mock.init(fs, {
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
