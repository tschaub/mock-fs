'use strict';

const helper = require('../helper');
const fs = require('fs');
const path = require('path');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.realpath(path, [cache], callback)', function() {
  beforeEach(function() {
    mock({
      'dir/file.txt': 'content',
      link: mock.symlink({path: './dir/file.txt'})
    });
  });
  afterEach(mock.restore);

  it('resolves the real path for a symbolic link', function(done) {
    fs.realpath('link', function(err, resolved) {
      if (err) {
        return done(err);
      }
      assert.equal(resolved, path.resolve('dir/file.txt'));
      done();
    });
  });

  withPromise.it('promise resolves the real path for a symbolic link', function(
    done
  ) {
    fs.promises.realpath('link').then(function(resolved) {
      assert.equal(resolved, path.resolve('dir/file.txt'));
      done();
    }, done);
  });

  it('resolves the real path regular file', function(done) {
    fs.realpath('dir/file.txt', function(err, resolved) {
      if (err) {
        return done(err);
      }
      assert.equal(resolved, path.resolve('dir/file.txt'));
      done();
    });
  });

  withPromise.it('promise resolves the real path regular file', function(done) {
    fs.promises.realpath('dir/file.txt').then(function(resolved) {
      assert.equal(resolved, path.resolve('dir/file.txt'));
      done();
    }, done);
  });

  it('fails on file not exist', function(done) {
    fs.realpath('bogus', function(err, resolved) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  withPromise.it('promise fails on file not exist', function(done) {
    fs.promises.realpath('bogus').then(
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

describe('fs.realpathSync(path, [cache])', function() {
  beforeEach(function() {
    mock({
      'dir/file.txt': 'content',
      link: mock.symlink({path: './dir/file.txt'})
    });
  });
  afterEach(mock.restore);

  it('resolves the real path for a symbolic link', function() {
    const resolved = fs.realpathSync('link');
    assert.equal(resolved, path.resolve('dir/file.txt'));
  });

  it('resolves the real path regular file', function() {
    const resolved = fs.realpathSync('dir/file.txt');
    assert.equal(resolved, path.resolve('dir/file.txt'));
  });

  it('fails on file not exist', function() {
    assert.throws(function() {
      fs.realpathSync('bogus');
    });
  });
});
