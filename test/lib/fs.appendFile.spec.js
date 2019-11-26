'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const bufferFrom = require('../../lib/buffer').from;

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.appendFile(filename, data, [options], callback)', function() {
  beforeEach(function() {
    mock({
      'dir/file.txt': 'file content',
      'link.txt': mock.symlink({path: 'dir/file.txt'})
    });
  });
  afterEach(mock.restore);

  it('writes a string to a new file', function(done) {
    fs.appendFile('foo', 'bar', function(err) {
      if (err) {
        return done(err);
      }
      assert.equal(String(fs.readFileSync('foo')), 'bar');
      done();
    });
  });

  withPromise.it('promise writes a string to a new file', function(done) {
    fs.promises.appendFile('foo', 'bar').then(function() {
      assert.equal(String(fs.readFileSync('foo')), 'bar');
      done();
    }, done);
  });

  it('appends a string to an existing file', function(done) {
    fs.appendFile('dir/file.txt', ' bar', function(err) {
      if (err) {
        return done(err);
      }
      assert.equal(String(fs.readFileSync('dir/file.txt')), 'file content bar');
      done();
    });
  });

  withPromise.it('promise appends a string to an existing file', function(
    done
  ) {
    fs.promises.appendFile('dir/file.txt', ' bar').then(function() {
      assert.equal(String(fs.readFileSync('dir/file.txt')), 'file content bar');
      done();
    }, done);
  });

  it('appends a buffer to a file', function(done) {
    fs.appendFile('dir/file.txt', bufferFrom(' bar'), function(err) {
      if (err) {
        return done(err);
      }
      assert.equal(String(fs.readFileSync('dir/file.txt')), 'file content bar');
      done();
    });
  });

  withPromise.it('promise appends a buffer to a file', function(done) {
    fs.promises.appendFile('dir/file.txt', bufferFrom(' bar')).then(function() {
      assert.equal(String(fs.readFileSync('dir/file.txt')), 'file content bar');
      done();
    }, done);
  });

  it('appends via a symbolic link file', function(done) {
    fs.appendFile('link.txt', ' bar', function(err) {
      if (err) {
        return done(err);
      }
      assert.equal(String(fs.readFileSync('dir/file.txt')), 'file content bar');
      done();
    });
  });

  withPromise.it('promise appends via a symbolic link file', function(done) {
    fs.promises.appendFile('link.txt', ' bar').then(function() {
      assert.equal(String(fs.readFileSync('dir/file.txt')), 'file content bar');
      done();
    }, done);
  });

  it('fails if directory does not exist', function(done) {
    fs.appendFile('foo/bar', 'baz', function(err) {
      assert.instanceOf(err, Error);
      done();
    });
  });

  withPromise.it('promise fails if directory does not exist', function(done) {
    fs.promises.appendFile('foo/bar', 'baz').then(
      function() {
        assert.fail('should not succeed.');
        done();
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      }
    );
  });
});

describe('fs.appendFileSync(filename, data, [options]', function() {
  beforeEach(function() {
    mock({
      'path/to/file': 'content'
    });
  });
  afterEach(mock.restore);

  it('writes a string to a new file', function() {
    fs.appendFileSync('foo', 'bar');
    assert.equal(String(fs.readFileSync('foo')), 'bar');
  });

  it('appends a string to an existing file', function() {
    fs.appendFileSync('path/to/file', ' bar');
    assert.equal(String(fs.readFileSync('path/to/file')), 'content bar');
  });

  it('fails if directory does not exist', function() {
    assert.throws(function() {
      fs.appendFileSync('foo/bar', 'baz');
    });
  });
});
