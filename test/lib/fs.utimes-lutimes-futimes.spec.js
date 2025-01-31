const fs = require('fs');
const {afterEach, beforeEach, describe, it} = require('mocha');
const mock = require('../../lib/index.js');
const helper = require('../helper.js');

const assert = helper.assert;

describe('fs.utimes(path, atime, mtime, callback)', function () {
  beforeEach(function () {
    mock({
      dir: {},
      'file.txt': mock.file({
        content: 'content',
        atime: new Date(1),
        mtime: new Date(1),
      }),
      link: mock.symlink({
        path: './file.txt',
        atime: new Date(2),
        mtime: new Date(2),
      }),
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function (done) {
    fs.utimes('file.txt', new Date(100), new Date(200), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      done();
    });
  });

  it('updates timestamps for a file following symlink', function (done) {
    fs.utimes('link', new Date(100), new Date(200), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.lstatSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      const stats2 = fs.lstatSync('link');
      assert.equal(stats2.atime.getTime(), 2);
      assert.equal(stats2.mtime.getTime(), 2);
      done();
    });
  });

  it('supports Buffer input', function (done) {
    fs.utimes(
      Buffer.from('file.txt'),
      new Date(100),
      new Date(200),
      function (err) {
        if (err) {
          return done(err);
        }
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      },
    );
  });

  it('promise updates timestamps for a file', function (done) {
    fs.promises
      .utimes('file.txt', new Date(100), new Date(200))
      .then(function () {
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      })
      .catch(done);
  });

  it('updates timestamps for a directory', function (done) {
    fs.utimes('dir', new Date(300), new Date(400), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('dir');
      assert.equal(stats.atime.getTime(), 300);
      assert.equal(stats.mtime.getTime(), 400);
      done();
    });
  });

  it('promise updates timestamps for a directory', function (done) {
    fs.promises
      .utimes('dir', new Date(300), new Date(400))
      .then(function () {
        const stats = fs.statSync('dir');
        assert.equal(stats.atime.getTime(), 300);
        assert.equal(stats.mtime.getTime(), 400);
        done();
      })
      .catch(done);
  });

  it('fails for a bogus path', function (done) {
    fs.utimes('bogus.txt', new Date(100), new Date(200), function (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('promise fails for a bogus path', function (done) {
    fs.promises.utimes('bogus.txt', new Date(100), new Date(200)).then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      },
    );
  });
});

describe('fs.lutimes(path, atime, mtime, callback)', function () {
  beforeEach(function () {
    mock({
      dir: {},
      'file.txt': mock.file({
        content: 'content',
        atime: new Date(1),
        mtime: new Date(1),
      }),
      link: mock.symlink({
        path: './file.txt',
        atime: new Date(2),
        mtime: new Date(2),
      }),
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function (done) {
    fs.lutimes('file.txt', new Date(100), new Date(200), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      done();
    });
  });

  it('updates timestamps for a file but not following symlink', function (done) {
    fs.lutimes('link', new Date(100), new Date(200), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.lstatSync('file.txt');
      assert.equal(stats.atime.getTime(), 1);
      assert.equal(stats.mtime.getTime(), 1);
      const stats2 = fs.lstatSync('link');
      assert.equal(stats2.atime.getTime(), 100);
      assert.equal(stats2.mtime.getTime(), 200);
      done();
    });
  });

  it('supports Buffer input', function (done) {
    fs.lutimes(
      Buffer.from('file.txt'),
      new Date(100),
      new Date(200),
      function (err) {
        if (err) {
          return done(err);
        }
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      },
    );
  });

  it('promise updates timestamps for a file', function (done) {
    fs.promises
      .lutimes('file.txt', new Date(100), new Date(200))
      .then(function () {
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      })
      .catch(done);
  });

  it('updates timestamps for a directory', function (done) {
    fs.lutimes('dir', new Date(300), new Date(400), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('dir');
      assert.equal(stats.atime.getTime(), 300);
      assert.equal(stats.mtime.getTime(), 400);
      done();
    });
  });

  it('promise updates timestamps for a directory', function (done) {
    fs.promises
      .lutimes('dir', new Date(300), new Date(400))
      .then(function () {
        const stats = fs.statSync('dir');
        assert.equal(stats.atime.getTime(), 300);
        assert.equal(stats.mtime.getTime(), 400);
        done();
      })
      .catch(done);
  });

  it('fails for a bogus path', function (done) {
    fs.lutimes('bogus.txt', new Date(100), new Date(200), function (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('promise fails for a bogus path', function (done) {
    fs.promises.lutimes('bogus.txt', new Date(100), new Date(200)).then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      },
    );
  });
});

describe('fs.utimesSync(path, atime, mtime)', function () {
  beforeEach(function () {
    mock({
      'file.txt': mock.file({
        content: 'content',
        atime: new Date(1),
        mtime: new Date(1),
      }),
      link: mock.symlink({
        path: './file.txt',
        atime: new Date(2),
        mtime: new Date(2),
      }),
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function () {
    fs.utimesSync('file.txt', new Date(100), new Date(200));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
  });

  it('updates timestamps for a file following symlink', function () {
    fs.utimesSync('link', new Date(100), new Date(200));
    const stats = fs.lstatSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
    const stats2 = fs.lstatSync('link');
    assert.equal(stats2.atime.getTime(), 2);
    assert.equal(stats2.mtime.getTime(), 2);
  });
});

describe('fs.lutimesSync(path, atime, mtime)', function () {
  beforeEach(function () {
    mock({
      'file.txt': mock.file({
        content: 'content',
        atime: new Date(1),
        mtime: new Date(1),
      }),
      link: mock.symlink({
        path: './file.txt',
        atime: new Date(2),
        mtime: new Date(2),
      }),
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function () {
    fs.lutimesSync('file.txt', new Date(100), new Date(200));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
  });

  it('updates timestamps for a file but not following symlink', function () {
    fs.lutimesSync('link', new Date(100), new Date(200));
    const stats = fs.lstatSync('file.txt');
    assert.equal(stats.atime.getTime(), 1);
    assert.equal(stats.mtime.getTime(), 1);
    const stats2 = fs.lstatSync('link');
    assert.equal(stats2.atime.getTime(), 100);
    assert.equal(stats2.mtime.getTime(), 200);
  });
});

describe('fs.futimes(fd, atime, mtime, callback)', function () {
  beforeEach(function () {
    mock({
      dir: {},
      'file.txt': mock.file({
        content: 'content',
        atime: new Date(1),
        mtime: new Date(1),
      }),
      link: mock.symlink({
        path: './file.txt',
        atime: new Date(2),
        mtime: new Date(2),
      }),
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function (done) {
    const fd = fs.openSync('file.txt', 'r');
    fs.futimes(fd, new Date(100), new Date(200), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      done();
    });
  });

  it('updates timestamps for a file following symlink', function (done) {
    const fd = fs.openSync('link', 'r');
    fs.futimes(fd, new Date(100), new Date(200), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.lstatSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      const stats2 = fs.lstatSync('link');
      assert.equal(stats2.atime.getTime(), 2);
      assert.equal(stats2.mtime.getTime(), 2);
      done();
    });
  });

  it('promise updates timestamps for a file', function (done) {
    fs.promises
      .open('file.txt', 'r')
      .then(function (fd) {
        return fd.utimes(new Date(100), new Date(200));
      })
      .then(function () {
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      })
      .catch(done);
  });

  it('updates timestamps for a directory', function (done) {
    const fd = fs.openSync('dir', 'r');
    fs.futimes(fd, new Date(300), new Date(400), function (err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('dir');
      assert.equal(stats.atime.getTime(), 300);
      assert.equal(stats.mtime.getTime(), 400);
      done();
    });
  });

  it('promise updates timestamps for a directory', function (done) {
    fs.promises
      .open('dir', 'r')
      .then(function (fd) {
        return fd.utimes(new Date(300), new Date(400));
      })
      .then(function () {
        const stats = fs.statSync('dir');
        assert.equal(stats.atime.getTime(), 300);
        assert.equal(stats.mtime.getTime(), 400);
        done();
      })
      .catch(done);
  });
});

describe('fs.futimesSync(path, atime, mtime)', function () {
  beforeEach(function () {
    mock({
      'file.txt': mock.file({
        content: 'content',
        atime: new Date(1),
        mtime: new Date(1),
      }),
      link: mock.symlink({
        path: './file.txt',
        atime: new Date(2),
        mtime: new Date(2),
      }),
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function () {
    const fd = fs.openSync('file.txt', 'r');
    fs.futimesSync(fd, new Date(100), new Date(200));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
  });

  it('updates timestamps for a file following symlink', function () {
    const fd = fs.openSync('link', 'r');
    fs.futimesSync(fd, new Date(100), new Date(200));
    const stats = fs.lstatSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
    const stats2 = fs.lstatSync('link');
    assert.equal(stats2.atime.getTime(), 2);
    assert.equal(stats2.mtime.getTime(), 2);
  });
});
