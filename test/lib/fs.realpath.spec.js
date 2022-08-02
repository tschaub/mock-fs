'use strict';

const helper = require('../helper.js');
const fs = require('fs');
const path = require('path');
const mock = require('../../lib/index.js');

const assert = helper.assert;
const assertEqualPaths = helper.assertEqualPaths;

describe('fs.realpath(path, [cache], callback)', function () {
  beforeEach(function () {
    mock({
      'dir/file.txt': 'content',
      link: mock.symlink({path: './dir/file.txt'}),
    });
  });
  afterEach(mock.restore);

  it('resolves the real path for a symbolic link', function (done) {
    fs.realpath('link', function (err, resolved) {
      if (err) {
        return done(err);
      }
      assertEqualPaths(resolved, path.resolve('dir/file.txt'));
      done();
    });
  });

  it('promise resolves the real path for a symbolic link', function (done) {
    fs.promises.realpath('link').then(function (resolved) {
      assertEqualPaths(resolved, path.resolve('dir/file.txt'));
      done();
    }, done);
  });

  it('resolves the real path regular file', function (done) {
    fs.realpath('dir/file.txt', function (err, resolved) {
      if (err) {
        return done(err);
      }
      assertEqualPaths(resolved, path.resolve('dir/file.txt'));
      done();
    });
  });

  it('promise resolves the real path regular file', function (done) {
    fs.promises.realpath('dir/file.txt').then(function (resolved) {
      assertEqualPaths(resolved, path.resolve('dir/file.txt'));
      done();
    }, done);
  });

  it('fails on file not exist', function (done) {
    fs.realpath('bogus', function (err, resolved) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('promise fails on file not exist', function (done) {
    fs.promises.realpath('bogus').then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      }
    );
  });
});

if (fs.realpath.native) {
  describe('fs.realpath.native(path, [cache], callback)', function () {
    beforeEach(function () {
      mock({
        'dir/file.txt': 'content',
        link: mock.symlink({path: './dir/file.txt'}),
      });
    });
    afterEach(mock.restore);

    it('resolves the real path for a symbolic link', function (done) {
      fs.realpath.native('link', function (err, resolved) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(resolved, path.resolve('dir/file.txt'));
        done();
      });
    });

    it('resolves the real path regular file', function (done) {
      fs.realpath.native('dir/file.txt', function (err, resolved) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(resolved, path.resolve('dir/file.txt'));
        done();
      });
    });

    it('fails on file not exist', function (done) {
      fs.realpath.native('bogus', function (err, resolved) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      });
    });
  });
}

describe('fs.realpathSync(path, [cache])', function () {
  beforeEach(function () {
    mock({
      'dir/file.txt': 'content',
      link: mock.symlink({path: './dir/file.txt'}),
    });
  });
  afterEach(mock.restore);

  it('resolves the real path for a symbolic link', function () {
    const resolved = fs.realpathSync('link');
    assertEqualPaths(resolved, path.resolve('dir/file.txt'));
  });

  it('resolves the real path regular file', function () {
    const resolved = fs.realpathSync('dir/file.txt');
    assertEqualPaths(resolved, path.resolve('dir/file.txt'));
  });

  it('fails on file not exist', function () {
    assert.throws(function () {
      fs.realpathSync('bogus');
    });
  });
});

if (fs.realpathSync.native) {
  describe('fs.realpathSync.native(path, [cache])', function () {
    beforeEach(function () {
      mock({
        'dir/file.txt': 'content',
        link: mock.symlink({path: './dir/file.txt'}),
      });
    });
    afterEach(mock.restore);

    it('resolves the real path for a symbolic link', function () {
      const resolved = fs.realpathSync.native('link');
      assertEqualPaths(resolved, path.resolve('dir/file.txt'));
    });

    it('resolves the real path regular file', function () {
      const resolved = fs.realpathSync.native('dir/file.txt');
      assertEqualPaths(resolved, path.resolve('dir/file.txt'));
    });

    it('fails on file not exist', function () {
      assert.throws(function () {
        fs.realpathSync.native('bogus');
      });
    });
  });
}
