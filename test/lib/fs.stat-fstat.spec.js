'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const semver = require('semver');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.stat(path, callback)', function() {
  beforeEach(function() {
    mock({
      '/path/to/file.txt': mock.file({
        ctime: new Date(1),
        mtime: new Date(2),
        atime: new Date(3),
        uid: 42,
        gid: 43
      }),
      '/dir/symlink': mock.symlink({path: '/path/to/file.txt'}),
      '/empty': {}
    });
  });
  afterEach(mock.restore);

  xit('creates an instance of fs.Stats', function(done) {
    fs.stat('/path/to/file.txt', function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.instanceOf(stats, fs.Stats);
      done();
    });
  });

  withPromise.xit('promise creates an instance of fs.Stats', function(done) {
    fs.promises.stat('/path/to/file.txt').then(function(stats) {
      assert.instanceOf(stats, fs.Stats);
      done();
    }, done);
  });

  it('identifies files', function(done) {
    fs.stat('/path/to/file.txt', function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      done();
    });
  });

  it('supports Buffer input', function(done) {
    fs.stat(Buffer.from('/path/to/file.txt'), function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      done();
    });
  });

  withPromise.it('promise identifies files', function(done) {
    fs.promises.stat('/path/to/file.txt').then(function(stats) {
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isDirectory());
      done();
    }, done);
  });

  it('identifies directories', function(done) {
    fs.stat('/empty', function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isDirectory());
      assert.isFalse(stats.isFile());
      done();
    });
  });

  withPromise.it('promise identifies directories', function(done) {
    fs.promises.stat('/empty').then(function(stats) {
      assert.isTrue(stats.isDirectory());
      assert.isFalse(stats.isFile());
      done();
    }, done);
  });

  it('provides file stats', function(done) {
    fs.stat('/path/to/file.txt', function(err, stats) {
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

  withPromise.it('promise provides file stats', function(done) {
    fs.promises.stat('/path/to/file.txt').then(function(stats) {
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

  if (
    process.platform !== 'win32' ||
    semver.coerce(process.version).major !== 10
  ) {
    // The fix for https://github.com/nodejs/node/issues/25913
    // is not shipped in v10. But it's shipped in v12.
    it('includes blocks and blksize in stats', function(done) {
      fs.stat('/path/to/file.txt', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      });
    });

    withPromise.it('promise includes blocks and blksize in stats', function(
      done
    ) {
      fs.promises.stat('/path/to/file.txt').then(function(stats) {
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      }, done);
    });
  }

  it('provides directory stats', function(done) {
    fs.stat('/path', function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.instanceOf(stats.ctime, Date);
      assert.instanceOf(stats.mtime, Date);
      assert.instanceOf(stats.atime, Date);
      if (process.getuid) {
        assert.isNumber(stats.uid);
      } else {
        assert.isNaN(stats.uid);
      }
      if (process.getgid) {
        assert.isNumber(stats.gid);
      } else {
        assert.isNaN(stats.gid);
      }
      assert.equal(stats.nlink, 3);
      assert.isNumber(stats.rdev);
      done();
    });
  });

  withPromise.it('promise provides directory stats', function(done) {
    fs.promises.stat('/path').then(function(stats) {
      assert.instanceOf(stats.ctime, Date);
      assert.instanceOf(stats.mtime, Date);
      assert.instanceOf(stats.atime, Date);
      if (process.getuid) {
        assert.isNumber(stats.uid);
      } else {
        assert.isNaN(stats.uid);
      }
      if (process.getgid) {
        assert.isNumber(stats.gid);
      } else {
        assert.isNaN(stats.gid);
      }
      assert.equal(stats.nlink, 3);
      assert.isNumber(stats.rdev);
      done();
    }, done);
  });

  if (
    process.platform !== 'win32' ||
    semver.coerce(process.version).major !== 10
  ) {
    // The fix for https://github.com/nodejs/node/issues/25913
    // is not shipped in v10. But it's shipped in v12.
    it('includes blocks and blksize in directory stats', function(done) {
      fs.stat('/path', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isNumber(stats.blocks);
        assert.isNumber(stats.blksize);
        done();
      });
    });

    withPromise.it(
      'promise includes blocks and blksize in directory stats',
      function(done) {
        fs.promises.stat('/path').then(function(stats) {
          assert.isNumber(stats.blocks);
          assert.isNumber(stats.blksize);
          done();
        }, done);
      }
    );
  }
});

describe('fs.fstat(fd, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      empty: {}
    });
  });
  afterEach(mock.restore);

  it('accepts a file descriptor for a file (r)', function(done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.fstat(fd, function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isFile());
      assert.equal(stats.size, 12);
      done();
    });
  });

  withPromise.it('promise accepts a file descriptor for a file (r)', function(
    done
  ) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function(fd) {
        return fd.stat();
      })
      .then(function(stats) {
        assert.isTrue(stats.isFile());
        assert.equal(stats.size, 12);
        done();
      }, done);
  });

  it('accepts a file descriptor for a directory (r)', function(done) {
    const fd = fs.openSync('path/to', 'r');
    fs.fstat(fd, function(err, stats) {
      if (err) {
        return done(err);
      }
      assert.isTrue(stats.isDirectory());
      assert.isTrue(stats.size > 0);
      done();
    });
  });

  withPromise.it(
    'promise accepts a file descriptor for a directory (r)',
    function(done) {
      fs.promises
        .open('path/to', 'r')
        .then(function(fd) {
          return fd.stat();
        })
        .then(function(stats) {
          assert.isTrue(stats.isDirectory());
          assert.isTrue(stats.size > 0);
          done();
        }, done);
    }
  );

  it('fails for bad file descriptor', function(done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.closeSync(fd);
    fs.fstat(fd, function(err, stats) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EBADF');
      done();
    });
  });

  withPromise.it('promise fails for bad file descriptor', function(done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function(fd) {
        return fd.close().then(function() {
          return fd.stat();
        });
      })
      .then(
        function() {
          assert.fail('should not succeed.');
          done();
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EBADF');
          done();
        }
      );
  });
});

describe('fs.fstatSync(fd)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      empty: {}
    });
  });
  afterEach(mock.restore);

  it('accepts a file descriptor for a file (r)', function() {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const stats = fs.fstatSync(fd);
    assert.isTrue(stats.isFile());
    assert.equal(stats.size, 12);
  });

  it('accepts a file descriptor for a directory (r)', function() {
    const fd = fs.openSync('path/to', 'r');
    const stats = fs.fstatSync(fd);
    assert.isTrue(stats.isDirectory());
    assert.isTrue(stats.size > 0);
  });

  it('fails for bad file descriptor', function() {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.closeSync(fd);
    assert.throws(function() {
      fs.fstatSync(fd);
    });
  });
});
