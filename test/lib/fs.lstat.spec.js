'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.lstat(path, callback)', function() {
  beforeEach(function() {
    mock({
      'file.txt': mock.file({
        content: 'content',
        mtime: new Date(1)
      }),
      link: mock.symlink({
        path: './file.txt',
        mtime: new Date(2)
      })
    });
  });
  afterEach(mock.restore);

  it('stats a symbolic link', function(done) {
    fs.lstat('link', function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(stats.mtime.getTime(), 2);
      done();
    });
  });

  withPromise.it('promise stats a symbolic link', function(done) {
    fs.promises.lstat('link').then(function(stats) {
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(stats.mtime.getTime(), 2);
      done();
    }, done);
  });

  it('stats a regular file', function(done) {
    fs.lstat('file.txt', function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isSymbolicLink());
      assert.equal(stats.mtime.getTime(), 1);
      done();
    });
  });

  withPromise.it('promise stats a regular file', function(done) {
    fs.promises.lstat('file.txt').then(function(stats) {
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isSymbolicLink());
      assert.equal(stats.mtime.getTime(), 1);
      done();
    }, done);
  });

  it('fails on file not exist', function(done) {
    fs.lstat('bogus', function(err, stats) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  withPromise.it('promise fails on file not exist', function(done) {
    fs.promises.lstat('bogus').then(
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

describe('fs.lstatSync(path)', function() {
  beforeEach(function() {
    mock({
      'file.txt': mock.file({
        content: 'content',
        mtime: new Date(1)
      }),
      link: mock.symlink({
        path: './file.txt',
        mtime: new Date(2)
      })
    });
  });
  afterEach(mock.restore);

  it('stats a symbolic link', function() {
    const stats = fs.lstatSync('link');
    assert.isTrue(stats.isSymbolicLink());
    assert.isFalse(stats.isFile());
    assert.equal(stats.mtime.getTime(), 2);
  });

  it('stats a regular file', function() {
    const stats = fs.lstatSync('file.txt');
    assert.isTrue(stats.isFile());
    assert.isFalse(stats.isSymbolicLink());
    assert.equal(stats.mtime.getTime(), 1);
  });

  it('fails on file not exist', function() {
    assert.throws(function() {
      fs.lstatSync('bogus');
    });
  });
});
