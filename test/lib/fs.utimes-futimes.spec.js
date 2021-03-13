'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.utimes(path, atime, mtime, callback)', function() {
  beforeEach(function() {
    mock({
      dir: {},
      'file.txt': 'content'
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function(done) {
    fs.utimes('file.txt', new Date(100), new Date(200), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      done();
    });
  });

  it('supports Buffer input', function(done) {
    fs.utimes(Buffer.from('file.txt'), new Date(100), new Date(200), function(
      err
    ) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      done();
    });
  });

  withPromise.it('promise updates timestamps for a file', function(done) {
    fs.promises
      .utimes('file.txt', new Date(100), new Date(200))
      .then(function() {
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      }, done);
  });

  it('updates timestamps for a directory', function(done) {
    fs.utimes('dir', new Date(300), new Date(400), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('dir');
      assert.equal(stats.atime.getTime(), 300);
      assert.equal(stats.mtime.getTime(), 400);
      done();
    });
  });

  withPromise.it('promise updates timestamps for a directory', function(done) {
    fs.promises.utimes('dir', new Date(300), new Date(400)).then(function() {
      const stats = fs.statSync('dir');
      assert.equal(stats.atime.getTime(), 300);
      assert.equal(stats.mtime.getTime(), 400);
      done();
    }, done);
  });

  it('fails for a bogus path', function(done) {
    fs.utimes('bogus.txt', new Date(100), new Date(200), function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  withPromise.it('promise fails for a bogus path', function(done) {
    fs.promises.utimes('bogus.txt', new Date(100), new Date(200)).then(
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

describe('fs.utimesSync(path, atime, mtime)', function() {
  beforeEach(function() {
    mock({
      'file.txt': 'content'
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function() {
    fs.utimesSync('file.txt', new Date(100), new Date(200));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
  });
});

describe('fs.futimes(fd, atime, mtime, callback)', function() {
  beforeEach(function() {
    mock({
      dir: {},
      'file.txt': 'content'
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function(done) {
    const fd = fs.openSync('file.txt', 'r');
    fs.futimes(fd, new Date(100), new Date(200), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
      done();
    });
  });

  withPromise.it('promise updates timestamps for a file', function(done) {
    fs.promises
      .open('file.txt', 'r')
      .then(function(fd) {
        return fd.utimes(new Date(100), new Date(200));
      })
      .then(function() {
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      }, done);
  });

  it('updates timestamps for a directory', function(done) {
    const fd = fs.openSync('dir', 'r');
    fs.futimes(fd, new Date(300), new Date(400), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('dir');
      assert.equal(stats.atime.getTime(), 300);
      assert.equal(stats.mtime.getTime(), 400);
      done();
    });
  });

  withPromise.it('promise updates timestamps for a directory', function(done) {
    fs.promises
      .open('dir', 'r')
      .then(function(fd) {
        return fd.utimes(new Date(300), new Date(400));
      })
      .then(function() {
        const stats = fs.statSync('dir');
        assert.equal(stats.atime.getTime(), 300);
        assert.equal(stats.mtime.getTime(), 400);
        done();
      }, done);
  });
});

describe('fs.futimesSync(path, atime, mtime)', function() {
  beforeEach(function() {
    mock({
      'file.txt': 'content'
    });
  });
  afterEach(mock.restore);

  it('updates timestamps for a file', function() {
    const fd = fs.openSync('file.txt', 'r');
    fs.futimesSync(fd, new Date(100), new Date(200));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.atime.getTime(), 100);
    assert.equal(stats.mtime.getTime(), 200);
  });
});
