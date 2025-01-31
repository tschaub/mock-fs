const fs = require('fs');
const {afterEach, beforeEach, describe, it} = require('mocha');
const mock = require('../../lib/index.js');
const helper = require('../helper.js');

const assert = helper.assert;

describe('fs.link(srcpath, dstpath, callback)', function () {
  beforeEach(function () {
    mock({
      dir: {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('creates a link to a file', function (done) {
    assert.equal(fs.statSync('file.txt').nlink, 1);

    fs.link('file.txt', 'link.txt', function (err) {
      if (err) {
        return done(err);
      }
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(fs.statSync('link.txt').nlink, 2);
      assert.equal(fs.statSync('file.txt').nlink, 2);
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
      done();
    });
  });

  it('supports Buffer input', function (done) {
    assert.equal(fs.statSync('file.txt').nlink, 1);

    fs.link(Buffer.from('file.txt'), Buffer.from('link.txt'), function (err) {
      if (err) {
        return done(err);
      }
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(fs.statSync('link.txt').nlink, 2);
      assert.equal(fs.statSync('file.txt').nlink, 2);
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
      done();
    });
  });

  it('promise creates a link to a file', function (done) {
    assert.equal(fs.statSync('file.txt').nlink, 1);

    fs.promises
      .link('file.txt', 'link.txt')
      .then(function () {
        assert.isTrue(fs.statSync('link.txt').isFile());
        assert.equal(fs.statSync('link.txt').nlink, 2);
        assert.equal(fs.statSync('file.txt').nlink, 2);
        assert.equal(String(fs.readFileSync('link.txt')), 'content');
        done();
      })
      .catch(done);
  });

  it('works if original is renamed', function (done) {
    fs.link('file.txt', 'link.txt', function (err) {
      if (err) {
        return done(err);
      }
      fs.renameSync('file.txt', 'renamed.txt');
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
      done();
    });
  });

  it('promise works if original is renamed', function (done) {
    fs.promises
      .link('file.txt', 'link.txt')
      .then(function () {
        fs.renameSync('file.txt', 'renamed.txt');
        assert.isTrue(fs.statSync('link.txt').isFile());
        assert.equal(String(fs.readFileSync('link.txt')), 'content');
        done();
      })
      .catch(done);
  });

  it('works if original is removed', function (done) {
    assert.equal(fs.statSync('file.txt').nlink, 1);

    fs.link('file.txt', 'link.txt', function (err) {
      if (err) {
        return done(err);
      }
      assert.equal(fs.statSync('link.txt').nlink, 2);
      assert.equal(fs.statSync('file.txt').nlink, 2);
      fs.unlinkSync('file.txt');
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(fs.statSync('link.txt').nlink, 1);
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
      done();
    });
  });

  it('promise works if original is removed', function (done) {
    assert.equal(fs.statSync('file.txt').nlink, 1);

    fs.promises
      .link('file.txt', 'link.txt')
      .then(function () {
        assert.equal(fs.statSync('link.txt').nlink, 2);
        assert.equal(fs.statSync('file.txt').nlink, 2);
        fs.unlinkSync('file.txt');
        assert.isTrue(fs.statSync('link.txt').isFile());
        assert.equal(fs.statSync('link.txt').nlink, 1);
        assert.equal(String(fs.readFileSync('link.txt')), 'content');
        done();
      })
      .catch(done);
  });

  it('fails if original is a directory', function (done) {
    fs.link('dir', 'link', function (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EPERM');
      done();
    });
  });

  it('promise fails if original is a directory', function (done) {
    fs.promises.link('dir', 'link').then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EPERM');
        done();
      },
    );
  });
});

describe('fs.linkSync(srcpath, dstpath)', function () {
  beforeEach(function () {
    mock({
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('creates a link to a file', function () {
    fs.linkSync('file.txt', 'link.txt');
    assert.isTrue(fs.statSync('link.txt').isFile());
    assert.equal(String(fs.readFileSync('link.txt')), 'content');
  });

  it('works if original is renamed', function () {
    fs.linkSync('file.txt', 'link.txt');
    fs.renameSync('file.txt', 'renamed.txt');
    assert.isTrue(fs.statSync('link.txt').isFile());
    assert.equal(String(fs.readFileSync('link.txt')), 'content');
  });

  it('works if original is removed', function () {
    fs.linkSync('file.txt', 'link.txt');
    fs.unlinkSync('file.txt');
    assert.isTrue(fs.statSync('link.txt').isFile());
    assert.equal(String(fs.readFileSync('link.txt')), 'content');
  });

  it('fails if original is a directory', function () {
    assert.throws(function () {
      fs.linkSync('dir', 'link');
    });
  });
});

describe('fs.symlink(srcpath, dstpath, [type], callback)', function () {
  beforeEach(function () {
    mock({
      dir: {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('creates a symbolic link to a file', function (done) {
    fs.symlink('../file.txt', 'dir/link.txt', function (err) {
      if (err) {
        return done(err);
      }
      assert.isTrue(fs.statSync('dir/link.txt').isFile());
      assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
      done();
    });
  });

  // https://github.com/nodejs/node/issues/34514
  if (process.platform === 'win32') {
    it('supports Buffer input', function (done) {
      fs.symlink(
        Buffer.from('../file.txt'),
        Buffer.from('dir/link.txt'),
        function (err) {
          if (err) {
            return done(err);
          }
          assert.isTrue(fs.statSync('dir/link.txt').isFile());
          assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
          done();
        },
      );
    });
  } else {
    it('supports Buffer input', function (done) {
      fs.symlink(
        Buffer.from('../file.txt'),
        Buffer.from('dir/link.txt'),
        function (err) {
          if (err) {
            return done(err);
          }
          assert.isTrue(fs.statSync('dir/link.txt').isFile());
          assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
          done();
        },
      );
    });
  }

  it('promise creates a symbolic link to a file', function (done) {
    fs.promises
      .symlink('../file.txt', 'dir/link.txt')
      .then(function () {
        assert.isTrue(fs.statSync('dir/link.txt').isFile());
        assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
        done();
      })
      .catch(done);
  });

  it('breaks if original is renamed', function (done) {
    fs.symlink('file.txt', 'link.txt', function (err) {
      if (err) {
        return done(err);
      }
      assert.isTrue(fs.existsSync('link.txt'));
      fs.renameSync('file.txt', 'renamed.txt');
      assert.isFalse(fs.existsSync('link.txt'));
      done();
    });
  });

  it('promise breaks if original is renamed', function (done) {
    fs.promises
      .symlink('file.txt', 'link.txt')
      .then(function () {
        assert.isTrue(fs.existsSync('link.txt'));
        fs.renameSync('file.txt', 'renamed.txt');
        assert.isFalse(fs.existsSync('link.txt'));
        done();
      })
      .catch(done);
  });

  it('works if original is a directory', function (done) {
    fs.symlink('dir', 'link', function (err) {
      if (err) {
        return done(err);
      }
      assert.isTrue(fs.statSync('link').isDirectory());
      done();
    });
  });

  it('promise works if original is a directory', function (done) {
    fs.promises
      .symlink('dir', 'link')
      .then(function () {
        assert.isTrue(fs.statSync('link').isDirectory());
        done();
      })
      .catch(done);
  });
});

describe('fs.symlinkSync(srcpath, dstpath, [type])', function () {
  beforeEach(function () {
    mock({
      dir: {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('creates a symbolic link to a file', function () {
    fs.symlinkSync('../file.txt', 'dir/link.txt');
    assert.isTrue(fs.statSync('dir/link.txt').isFile());
    assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
  });

  it('breaks if original is renamed', function () {
    fs.symlinkSync('file.txt', 'link.txt');
    assert.isTrue(fs.existsSync('link.txt'));
    fs.renameSync('file.txt', 'renamed.txt');
    assert.isFalse(fs.existsSync('link.txt'));
  });

  it('works if original is a directory', function () {
    fs.symlinkSync('dir', 'link');
    assert.isTrue(fs.statSync('link').isDirectory());
  });
});
