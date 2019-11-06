'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const bufferAlloc = require('../../lib/buffer').alloc;

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.read(fd, buffer, offset, length, position, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content'
    });
  });
  afterEach(mock.restore);

  it('allows file contents to be read', function(done) {
    fs.open('path/to/file.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = bufferAlloc(12);
      fs.read(fd, buffer, 0, 12, 0, function(err2, bytesRead, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(bytesRead, 12);
        assert.equal(buf, buffer);
        assert.equal(String(buffer), 'file content');
        done();
      });
    });
  });

  withPromise.it('promise allows file contents to be read', function(done) {
    const buffer = bufferAlloc(12);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function(fd) {
        return fd.read(buffer, 0, 12, 0);
      })
      .then(function(result) {
        assert.equal(result.bytesRead, 12);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer), 'file content');
        done();
      }, done);
  });

  it('allows file contents to be read w/ offset', function(done) {
    fs.open('path/to/file.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = bufferAlloc(12);
      fs.read(fd, buffer, 5, 7, 0, function(err2, bytesRead, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(bytesRead, 7);
        assert.equal(buf, buffer);
        assert.equal(String(buffer.slice(5)), 'file co');
        done();
      });
    });
  });

  it('allows file contents to be read w/ length', function(done) {
    fs.open('path/to/file.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = bufferAlloc(12);
      fs.read(fd, buffer, 0, 4, 0, function(err2, bytesRead, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(bytesRead, 4);
        assert.equal(buf, buffer);
        assert.equal(String(buffer.slice(0, 4)), 'file');
        done();
      });
    });
  });

  it('allows file contents to be read w/ offset & length', function(done) {
    fs.open('path/to/file.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = bufferAlloc(12);
      fs.read(fd, buffer, 2, 4, 0, function(err2, bytesRead, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(bytesRead, 4);
        assert.equal(buf, buffer);
        assert.equal(String(buffer.slice(2, 6)), 'file');
        done();
      });
    });
  });

  it('allows file contents to be read w/ position', function(done) {
    fs.open('path/to/file.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = bufferAlloc(7);
      fs.read(fd, buffer, 0, 7, 5, function(err2, bytesRead, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(bytesRead, 7);
        assert.equal(buf, buffer);
        assert.equal(String(buffer), 'content');
        done();
      });
    });
  });

  it('allows read w/ offset, length, & position', function(done) {
    fs.open('path/to/file.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = bufferAlloc(12);
      fs.read(fd, buffer, 2, 7, 5, function(err2, bytesRead, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(bytesRead, 7);
        assert.equal(buf, buffer);
        assert.equal(String(buffer.slice(2, 9)), 'content');
        done();
      });
    });
  });

  it('fails for closed file descriptor', function(done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.closeSync(fd);
    fs.read(fd, bufferAlloc(12), 0, 12, 0, function(err, bytesRead, buf) {
      assert.instanceOf(err, Error);
      assert.equal(0, bytesRead);
      done();
    });
  });

  it('fails if not open for reading', function(done) {
    const fd = fs.openSync('path/to/file.txt', 'w');
    fs.read(fd, bufferAlloc(12), 0, 12, 0, function(err, bytesRead, buf) {
      assert.instanceOf(err, Error);
      assert.equal(0, bytesRead);
      done();
    });
  });
});

describe('fs.readSync(fd, buffer, offset, length, position)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content'
    });
  });
  afterEach(mock.restore);

  it('allows a file to be read synchronously', function() {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const buffer = bufferAlloc(12);
    const read = fs.readSync(fd, buffer, 0, 12, 0);
    assert.equal(read, 12);
    assert.equal(String(buffer), 'file content');
  });

  it('allows a file to be read in two parts', function() {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const first = bufferAlloc(4);
    fs.readSync(fd, first, 0, 4, 0);
    assert.equal(String(first), 'file');

    const second = bufferAlloc(7);
    fs.readSync(fd, second, 0, 7, 5);
    assert.equal(String(second), 'content');
  });

  it('treats null position as current position', function() {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const first = bufferAlloc(4);
    fs.readSync(fd, first, 0, 4, null);
    assert.equal(String(first), 'file');

    // consume the space
    assert.equal(fs.readSync(fd, bufferAlloc(1), 0, 1, null), 1);

    const second = bufferAlloc(7);
    fs.readSync(fd, second, 0, 7, null);
    assert.equal(String(second), 'content');
  });
});
