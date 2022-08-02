'use strict';

const helper = require('../helper.js');
const fs = require('fs');
const mock = require('../../lib/index.js');
const semver = require('semver');

const assert = helper.assert;

describe('fs.stat(path, options, callback)', function () {
  beforeEach(function () {
    mock({
      '/path/to/file.txt': mock.file({
        ctime: new Date(1),
        mtime: new Date(2),
        atime: new Date(3),
        uid: 42,
        gid: 43,
      }),
      '/dir/symlink': mock.symlink({
        path: '/path/to/file.txt',
        mtime: new Date(2),
      }),
      '/empty': {},
    });
  });
  afterEach(mock.restore);

  xit('creates an instance of fs.Stats', function (done) {
    fs.stat('/path/to/file.txt', function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.instanceOf(stats, fs.Stats);
      done();
    });
  });

  xit('promise creates an instance of fs.Stats', function (done) {
    fs.promises.stat('/path/to/file.txt').then(function (stats) {
      assert.instanceOf(stats, fs.Stats);
      done();
    }, done);
  });

  it('identifies files', function (done) {
    fs.stat('/path/to/file.txt', function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      assert.equal(stats.mtime.getTime(), 2);
      done();
    });
  });

  it('identifies files with bigint', function (done) {
    fs.stat('/path/to/file.txt', {bigint: true}, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      assert.equal(typeof stats.mtimeMs, 'bigint');
      done();
    });
  });

  it('supports Buffer input', function (done) {
    fs.stat(Buffer.from('/path/to/file.txt'), function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      assert.equal(stats.mtime.getTime(), 2);
      done();
    });
  });

  it('supports Buffer input with bigint', function (done) {
    fs.stat(
      Buffer.from('/path/to/file.txt'),
      {bigint: true},
      function (err, stats) {
        if (err) {
          return done(err);
        }
        assert.isTrue(stats.isFile());
        assert.isFalse(stats.isDirectory());
        assert.equal(typeof stats.mtimeMs, 'bigint');
        done();
      }
    );
  });

  it('promise identifies files', function (done) {
    fs.promises.stat('/path/to/file.txt').then(function (stats) {
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      done();
      assert.equal(stats.mtime.getTime(), 2);
    }, done);
  });

  it('promise identifies files', function (done) {
    fs.promises
      .stat('/path/to/file.txt', {bigint: true})
      .then(function (stats) {
        assert.isTrue(stats.isFile());
        assert.isFalse(stats.isDirectory());
        done();
        assert.equal(typeof stats.mtimeMs, 'bigint');
      }, done);
  });

  it('identifies directories', function (done) {
    fs.stat('/empty', function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isDirectory());
      assert.isFalse(stats.isFile());
      assert.equal(stats.size, 1);
      done();
    });
  });

  it('identifies directories with bigint', function (done) {
    fs.stat('/empty', {bigint: true}, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isDirectory());
      assert.isFalse(stats.isFile());
      assert.equal(typeof stats.size, 'bigint');
      done();
    });
  });

  it('promise identifies directories', function (done) {
    fs.promises.stat('/empty').then(function (stats) {
      assert.isTrue(stats.isDirectory());
      assert.isFalse(stats.isFile());
      assert.equal(stats.size, 1);
      done();
    }, done);
  });

  it('promise identifies directories with bigint', function (done) {
    fs.promises.stat('/empty', {bigint: true}).then(function (stats) {
      assert.isTrue(stats.isDirectory());
      assert.isFalse(stats.isFile());
      assert.equal(typeof stats.size, 'bigint');
      done();
    }, done);
  });

  it('provides file stats', function (done) {
    fs.stat('/path/to/file.txt', function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.equal(stats.ctime.getTime(), 1);
      assert.equal(stats.mtime.getTime(), 2);
      assert.equal(stats.atime.getTime(), 3);
      assert.equal(stats.uid, 42);
      assert.equal(stats.gid, 43);
      assert.equal(stats.nlink, 1);
      assert.isNumber(stats.rdev);
      done();
    });
  });

  it('provides file stats with bigint', function (done) {
    fs.stat('/path/to/file.txt', {bigint: true}, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.equal(typeof stats.ctimeMs, 'bigint');
      assert.equal(typeof stats.mtimeMs, 'bigint');
      assert.equal(typeof stats.atimeMs, 'bigint');
      assert.equal(typeof stats.uid, 'bigint');
      assert.equal(typeof stats.gid, 'bigint');
      assert.equal(typeof stats.nlink, 'bigint');
      assert.equal(typeof stats.rdev, 'bigint');
      done();
    });
  });

  it('promise provides file stats', function (done) {
    fs.promises.stat('/path/to/file.txt').then(function (stats) {
      assert.equal(stats.ctime.getTime(), 1);
      assert.equal(stats.mtime.getTime(), 2);
      assert.equal(stats.atime.getTime(), 3);
      assert.equal(stats.uid, 42);
      assert.equal(stats.gid, 43);
      assert.equal(stats.nlink, 1);
      assert.isNumber(stats.rdev);
      done();
    }, done);
  });

  it('promise provides file stats with bigint', function (done) {
    fs.promises
      .stat('/path/to/file.txt', {bigint: true})
      .then(function (stats) {
        assert.equal(typeof stats.ctimeMs, 'bigint');
        assert.equal(typeof stats.mtimeMs, 'bigint');
        assert.equal(typeof stats.atimeMs, 'bigint');
        assert.equal(typeof stats.uid, 'bigint');
        assert.equal(typeof stats.gid, 'bigint');
        assert.equal(typeof stats.nlink, 'bigint');
        assert.equal(typeof stats.rdev, 'bigint');
        done();
      }, done);
  });

  if (
    process.platform !== 'win32' ||
    semver.coerce(process.version).major !== 10
  ) {
    // The fix for https://github.com/nodejs/node/issues/25913
    // is not shipped in v10. But it's shipped in v12.
    it('includes blocks and blksize in stats', function (done) {
      fs.stat('/path/to/file.txt', function (err, stats) {
        if (err) {
          return done(err);
        }
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      });
    });

    it('promise includes blocks and blksize in stats', function (done) {
      fs.promises.stat('/path/to/file.txt').then(function (stats) {
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      }, done);
    });
  }

  it('provides directory stats', function (done) {
    fs.stat('/path', function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.instanceOf(stats.ctime, Date);
      assert.instanceOf(stats.mtime, Date);
      assert.instanceOf(stats.atime, Date);
      if (process.getuid) {
        assert.isNumber(stats.uid);
      } else {
        assert.strictEqual(stats.uid, 0);
      }
      if (process.getgid) {
        assert.isNumber(stats.gid);
      } else {
        assert.strictEqual(stats.gid, 0);
      }
      assert.equal(stats.nlink, 3);
      assert.isNumber(stats.rdev);
      done();
    });
  });

  it('provides directory stats with bigint', function (done) {
    fs.stat('/path', {bigint: true}, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.instanceOf(stats.ctime, Date);
      assert.instanceOf(stats.mtime, Date);
      assert.instanceOf(stats.atime, Date);
      if (process.getuid) {
        assert.equal(typeof stats.uid, 'bigint');
      } else {
        assert.strictEqual(stats.uid, 0n);
      }
      if (process.getgid) {
        assert.equal(typeof stats.gid, 'bigint');
      } else {
        assert.strictEqual(stats.gid, 0n);
      }
      assert.equal(typeof stats.nlink, 'bigint');
      assert.equal(typeof stats.rdev, 'bigint');
      done();
    });
  });

  it('promise provides directory stats', function (done) {
    fs.promises.stat('/path').then(function (stats) {
      assert.instanceOf(stats.ctime, Date);
      assert.instanceOf(stats.mtime, Date);
      assert.instanceOf(stats.atime, Date);
      if (process.getuid) {
        assert.isNumber(stats.uid);
      } else {
        assert.strictEqual(stats.uid, 0);
      }
      if (process.getgid) {
        assert.isNumber(stats.gid);
      } else {
        assert.strictEqual(stats.gid, 0);
      }
      assert.equal(stats.nlink, 3);
      assert.isNumber(stats.rdev);
      done();
    }, done);
  });

  it('promise provides directory stats with bigint', function (done) {
    fs.promises.stat('/path', {bigint: true}).then(function (stats) {
      assert.instanceOf(stats.ctime, Date);
      assert.instanceOf(stats.mtime, Date);
      assert.instanceOf(stats.atime, Date);
      if (process.getuid) {
        assert.equal(typeof stats.uid, 'bigint');
      } else {
        assert.strictEqual(stats.uid, 0n);
      }
      if (process.getgid) {
        assert.equal(typeof stats.gid, 'bigint');
      } else {
        assert.strictEqual(stats.gid, 0n);
      }
      assert.equal(typeof stats.nlink, 'bigint');
      assert.equal(typeof stats.rdev, 'bigint');
      done();
    }, done);
  });

  if (
    process.platform !== 'win32' ||
    semver.coerce(process.version).major !== 10
  ) {
    // The fix for https://github.com/nodejs/node/issues/25913
    // is not shipped in v10. But it's shipped in v12.
    it('includes blocks and blksize in directory stats', function (done) {
      fs.stat('/path', function (err, stats) {
        if (err) {
          return done(err);
        }
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      });
    });

    it('promise includes blocks and blksize in directory stats', function (done) {
      fs.promises.stat('/path').then(function (stats) {
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      }, done);
    });
  }
});

describe('fs.fstat(fd, options, callback)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
      empty: {},
    });
  });
  afterEach(mock.restore);

  it('accepts a file descriptor for a file (r)', function (done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.fstat(fd, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.equal(stats.size, 12);
      done();
    });
  });

  it('accepts a file descriptor for a file (r) with bigint', function (done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.fstat(fd, {bigint: true}, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.equal(typeof stats.size, 'bigint');
      done();
    });
  });

  it('promise accepts a file descriptor for a file (r)', function (done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.stat();
      })
      .then(function (stats) {
        assert.isTrue(stats.isFile());
        assert.equal(stats.size, 12);
        done();
      }, done);
  });

  it('promise accepts a file descriptor for a file (r) with bigint', function (done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.stat({bigint: true});
      })
      .then(function (stats) {
        assert.isTrue(stats.isFile());
        assert.equal(typeof stats.size, 'bigint');
        done();
      }, done);
  });

  it('accepts a file descriptor for a directory (r)', function (done) {
    const fd = fs.openSync('path/to', 'r');
    fs.fstat(fd, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isDirectory());
      assert.equal(stats.size, 1);
      done();
    });
  });

  it('accepts a file descriptor for a directory (r) with bigint', function (done) {
    const fd = fs.openSync('path/to', 'r');
    fs.fstat(fd, {bigint: true}, function (err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isDirectory());
      assert.equal(typeof stats.size, 'bigint');
      done();
    });
  });

  it('promise accepts a file descriptor for a directory (r)', function (done) {
    fs.promises
      .open('path/to', 'r')
      .then(function (fd) {
        return fd.stat();
      })
      .then(function (stats) {
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.size, 1);
        done();
      }, done);
  });

  it('promise accepts a file descriptor for a directory (r) with bigint', function (done) {
    fs.promises
      .open('path/to', 'r')
      .then(function (fd) {
        return fd.stat({bigint: true});
      })
      .then(function (stats) {
        assert.isTrue(stats.isDirectory());
        assert.equal(typeof stats.size, 'bigint');
        done();
      }, done);
  });

  it('fails for bad file descriptor', function (done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.closeSync(fd);
    fs.fstat(fd, function (err, stats) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EBADF');
      done();
    });
  });

  it('promise fails for bad file descriptor', function (done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.close().then(function () {
          return fd.stat({bigint: true});
        });
      })
      .then(
        function () {
          done(new Error('should not succeed.'));
        },
        function (err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EBADF');
          done();
        }
      );
  });
});

describe('fs.fstatSync(fd, options)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
      empty: {},
    });
  });
  afterEach(mock.restore);

  it('accepts a file descriptor for a file (r)', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const stats = fs.fstatSync(fd);
    assert.isTrue(stats.isFile());
    assert.equal(stats.size, 12);
  });

  it('accepts a file descriptor for a file (r) with bigint', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const stats = fs.fstatSync(fd, {bigint: true});
    assert.isTrue(stats.isFile());
    assert.equal(typeof stats.size, 'bigint');
  });

  it('accepts a file descriptor for a directory (r)', function () {
    const fd = fs.openSync('path/to', 'r');
    const stats = fs.fstatSync(fd);
    assert.isTrue(stats.isDirectory());
    assert.equal(stats.size, 1);
  });

  it('accepts a file descriptor for a directory (r) with bigint', function () {
    const fd = fs.openSync('path/to', 'r');
    const stats = fs.fstatSync(fd, {bigint: true});
    assert.isTrue(stats.isDirectory());
    assert.equal(typeof stats.size, 'bigint');
  });

  it('fails for bad file descriptor', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.closeSync(fd);
    assert.throws(function () {
      fs.fstatSync(fd);
    });
  });
});
