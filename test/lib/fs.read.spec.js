'use strict';

const helper = require('../helper.js');
const fs = require('fs');
const mock = require('../../lib/index.js');

const assert = helper.assert;

describe('fs.read(fd, buffer, offset, length, position, callback)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
    });
  });
  afterEach(mock.restore);

  it('allows file contents to be read', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.alloc(12);
      fs.read(fd, buffer, 0, 12, 0, function (err2, bytesRead, buf) {
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

  it('promise allows file contents to be read', function (done) {
    const buffer = Buffer.alloc(12);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.read(buffer, 0, 12, 0);
      })
      .then(function (result) {
        assert.equal(result.bytesRead, 12);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer), 'file content');
        done();
      })
      .catch(done);
  });

  it('allows file contents to be read w/ offset', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.alloc(12);
      fs.read(fd, buffer, 5, 7, 0, function (err2, bytesRead, buf) {
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

  it('promise allows file contents to be read w/ offset', function (done) {
    const buffer = Buffer.alloc(12);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.read(buffer, 5, 7, 0);
      })
      .then(function (result) {
        assert.equal(result.bytesRead, 7);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer.slice(5)), 'file co');
        done();
      })
      .catch(done);
  });

  it('allows file contents to be read w/ length', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.alloc(12);
      fs.read(fd, buffer, 0, 4, 0, function (err2, bytesRead, buf) {
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

  it('promise allows file contents to be read w/ length', function (done) {
    const buffer = Buffer.alloc(12);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.read(buffer, 0, 4, 0);
      })
      .then(function (result) {
        assert.equal(result.bytesRead, 4);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer.slice(0, 4)), 'file');
        done();
      })
      .catch(done);
  });

  it('allows file contents to be read w/ offset & length', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.alloc(12);
      fs.read(fd, buffer, 2, 4, 0, function (err2, bytesRead, buf) {
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

  it('promise allows file contents to be read w/ offset & length', function (done) {
    const buffer = Buffer.alloc(12);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.read(buffer, 2, 4, 0);
      })
      .then(function (result) {
        assert.equal(result.bytesRead, 4);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer.slice(2, 6)), 'file');
        done();
      })
      .catch(done);
  });

  it('allows file contents to be read w/ position', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.alloc(7);
      fs.read(fd, buffer, 0, 7, 5, function (err2, bytesRead, buf) {
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

  it('promise allows file contents to be read w/ position', function (done) {
    const buffer = Buffer.alloc(7);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.read(buffer, 0, 7, 5);
      })
      .then(function (result) {
        assert.equal(result.bytesRead, 7);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer), 'content');
        done();
      })
      .catch(done);
  });

  it('allows read w/ offset, length, & position', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.alloc(12);
      fs.read(fd, buffer, 2, 7, 5, function (err2, bytesRead, buf) {
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

  it('promise allows read w/ offset, length, & position', function (done) {
    const buffer = Buffer.alloc(12);
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.read(buffer, 2, 7, 5);
      })
      .then(function (result) {
        assert.equal(result.bytesRead, 7);
        assert.equal(result.buffer, buffer);
        assert.equal(String(buffer.slice(2, 9)), 'content');
        done();
      })
      .catch(done);
  });

  it('fails for closed file descriptor', function (done) {
    const fd = fs.openSync('path/to/file.txt', 'r');
    fs.closeSync(fd);
    fs.read(fd, Buffer.alloc(12), 0, 12, 0, function (err, bytesRead, buf) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EBADF');
      assert.equal(0, bytesRead);
      done();
    });
  });

  it('promise fails for closed file descriptor', function (done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.close().then(function () {
          return fd.read(Buffer.alloc(12), 0, 12, 0);
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

  it('fails if not open for reading', function (done) {
    const fd = fs.openSync('path/to/file.txt', 'w');
    fs.read(fd, Buffer.alloc(12), 0, 12, 0, function (err, bytesRead, buf) {
      assert.instanceOf(err, Error);
      assert.equal(0, bytesRead);
      done();
    });
  });

  it('promise fails if not open for reading', function (done) {
    fs.promises
      .open('path/to/file.txt', 'w')
      .then(function (fd) {
        return fd.read(Buffer.alloc(12), 0, 12, 0);
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

describe('fs.readSync(fd, buffer, offset, length, position)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
    });
  });
  afterEach(mock.restore);

  it('allows a file to be read synchronously', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const buffer = Buffer.alloc(12);
    const read = fs.readSync(fd, buffer, 0, 12, 0);
    assert.equal(read, 12);
    assert.equal(String(buffer), 'file content');
  });

  it('allows a file to be read in two parts', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const first = Buffer.alloc(4);
    fs.readSync(fd, first, 0, 4, 0);
    assert.equal(String(first), 'file');

    const second = Buffer.alloc(7);
    fs.readSync(fd, second, 0, 7, 5);
    assert.equal(String(second), 'content');
  });

  it('treats null position as current position', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    const first = Buffer.alloc(4);
    fs.readSync(fd, first, 0, 4, null);
    assert.equal(String(first), 'file');

    // consume the space
    assert.equal(fs.readSync(fd, Buffer.alloc(1), 0, 1, null), 1);

    const second = Buffer.alloc(7);
    fs.readSync(fd, second, 0, 7, null);
    assert.equal(String(second), 'content');
  });
});
