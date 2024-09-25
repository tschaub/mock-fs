'use strict';

const helper = require('../helper.js');
const fs = require('fs');
const mock = require('../../lib/index.js');

const assert = helper.assert;

describe('fs.unlink(path, callback)', function () {
  beforeEach(function () {
    mock({
      dir: {},
      dir2: mock.directory({
        mtime: new Date(1),
        items: {file: 'content here'},
      }),
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('deletes a file', function (done) {
    fs.unlink('file.txt', function (err) {
      if (err) {
        return done(err);
      }
      assert.isFalse(fs.existsSync('file.txt'));
      done();
    });
  });

  it('supports Buffer input', function (done) {
    fs.unlink(Buffer.from('file.txt'), function (err) {
      if (err) {
        return done(err);
      }
      assert.isFalse(fs.existsSync('file.txt'));
      done();
    });
  });

  it('promise deletes a file', function (done) {
    fs.promises
      .unlink('file.txt')
      .then(function () {
        assert.isFalse(fs.existsSync('file.txt'));
        done();
      })
      .catch(done);
  });

  it('updates mtime of parent', function (done) {
    const oldTime = fs.statSync('dir2').mtime;
    fs.unlink('dir2/file', function (err) {
      if (err) {
        return done(err);
      }
      assert.isFalse(fs.existsSync('dir2/file'));
      const newTime = fs.statSync('dir2').mtime;
      assert.isTrue(newTime > oldTime);
      done();
    });
  });

  it('updates mtime of parent', function (done) {
    const oldTime = fs.statSync('dir2').mtime;
    fs.promises
      .unlink('dir2/file')
      .then(function () {
        assert.isFalse(fs.existsSync('dir2/file'));
        const newTime = fs.statSync('dir2').mtime;
        assert.isTrue(newTime > oldTime);
        done();
      })
      .catch(done);
  });

  it('fails for a directory', function (done) {
    fs.unlink('dir', function (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EPERM');
      assert.isTrue(fs.existsSync('dir'));
      done();
    });
  });

  it('promise fails for a directory', function (done) {
    fs.promises.unlink('dir').then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EPERM');
        assert.isTrue(fs.existsSync('dir'));
        done();
      }
    );
  });

  it('respects previously opened file descriptors', function (done) {
    const fd = fs.openSync('file.txt', 'r');
    fs.unlink('file.txt', function (err) {
      if (err) {
        return done(err);
      }
      assert.isFalse(fs.existsSync('file.txt'));
      // but we can still use fd to read
      const buffer = Buffer.alloc(7);
      const read = fs.readSync(fd, buffer, 0, 7);
      assert.equal(read, 7);
      assert.equal(String(buffer), 'content');
      done();
    });
  });

  it('promise respects previously opened file descriptors', function (done) {
    const fd = fs.openSync('file.txt', 'r');
    fs.promises
      .unlink('file.txt')
      .then(function () {
        assert.isFalse(fs.existsSync('file.txt'));
        // but we can still use fd to read
        const buffer = Buffer.alloc(7);
        const read = fs.readSync(fd, buffer, 0, 7);
        assert.equal(read, 7);
        assert.equal(String(buffer), 'content');
        done();
      })
      .catch(done);
  });
});

describe('fs.unlinkSync(path)', function () {
  beforeEach(function () {
    mock({
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('deletes a file', function () {
    fs.unlinkSync('file.txt');
    assert.isFalse(fs.existsSync('file.txt'));
  });

  it('respects previously opened file descriptors', function () {
    const fd = fs.openSync('file.txt', 'r');
    fs.unlinkSync('file.txt');
    assert.isFalse(fs.existsSync('file.txt'));
    // but we can still use fd to read
    const buffer = Buffer.alloc(7);
    const read = fs.readSync(fd, buffer, 0, 7);
    assert.equal(read, 7);
    assert.equal(String(buffer), 'content');
  });
});
