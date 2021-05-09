'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const inVersion = helper.inVersion;
const withPromise = helper.withPromise;

describe('fs.lstat(path, options, callback)', function() {
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

  it('stats a symbolic link with bigint', function(done) {
    fs.lstat('link', {bigint: true}, function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(typeof stats.mtimeMs, 'bigint');
      done();
    });
  });

  it('suports Buffer input', function(done) {
    fs.lstat(Buffer.from('link'), function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(stats.mtime.getTime(), 2);
      done();
    });
  });

  it('suports Buffer input with bigint', function(done) {
    fs.lstat(Buffer.from('link'), {bigint: true}, function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(typeof stats.mtimeMs, 'bigint');
      done();
    });
  });

  it('promise stats a symbolic link', function(done) {
    fs.promises.lstat('link').then(function(stats) {
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(stats.mtime.getTime(), 2);
      done();
    }, done);
  });

  it(
    'promise stats a symbolic link with bigint',
    function(done) {
      fs.promises.lstat('link', {bigint: true}).then(function(stats) {
        assert.isTrue(stats.isSymbolicLink());
        assert.isFalse(stats.isFile());
        assert.equal(typeof stats.mtimeMs, 'bigint');
        done();
      }, done);
    }
  );

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

  it('stats a regular file with bigint', function(done) {
    fs.lstat('file.txt', {bigint: true}, function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isSymbolicLink());
      assert.equal(typeof stats.mtimeMs, 'bigint');
      done();
    });
  });

  it('promise stats a regular file', function(done) {
    fs.promises.lstat('file.txt').then(function(stats) {
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isSymbolicLink());
      assert.equal(stats.mtime.getTime(), 1);
      done();
    }, done);
  });

  it('promise stats a regular file with bigint', function(
    done
  ) {
    fs.promises.lstat('file.txt', {bigint: true}).then(function(stats) {
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isSymbolicLink());
      assert.equal(typeof stats.mtimeMs, 'bigint');
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

  it('promise fails on file not exist', function(done) {
    fs.promises.lstat('bogus').then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      }
    );
  });
});

describe('fs.lstatSync(path, options)', function() {
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

  it('stats a symbolic link with bigint', function() {
    const stats = fs.lstatSync('link', {bigint: true});
    assert.isTrue(stats.isSymbolicLink());
    assert.isFalse(stats.isFile());
    assert.equal(typeof stats.mtimeMs, 'bigint');
  });

  it('stats a regular file', function() {
    const stats = fs.lstatSync('file.txt');
    assert.isTrue(stats.isFile());
    assert.isFalse(stats.isSymbolicLink());
    assert.equal(stats.mtime.getTime(), 1);
  });

  it('stats a regular file with bigint', function() {
    const stats = fs.lstatSync('file.txt', {bigint: true});
    assert.isTrue(stats.isFile());
    assert.isFalse(stats.isSymbolicLink());
    assert.equal(typeof stats.mtimeMs, 'bigint');
  });

  it('fails on file not exist', function() {
    assert.throws(function() {
      fs.lstatSync('bogus');
    });
  });
});
