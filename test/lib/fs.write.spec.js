'use strict';

const helper = require('../helper.js');
const fs = require('fs');
const mock = require('../../lib/index.js');

const assert = helper.assert;

describe('fs.write(fd, buffer, offset, length, position, callback)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
    });
  });
  afterEach(mock.restore);

  it('writes a buffer to a file', function (done) {
    const fd = fs.openSync('path/new-file.txt', 'w');
    const buffer = Buffer.from('new file');
    fs.write(fd, buffer, 0, buffer.length, null, function (err, written, buf) {
      if (err) {
        return done(err);
      }
      assert.equal(written, 8);
      assert.equal(buf, buffer);
      assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
      done();
    });
  });

  it('promise writes a buffer to a file', function (done) {
    const buffer = Buffer.from('new file');
    fs.promises
      .open('path/new-file.txt', 'w')
      .then(function (fd) {
        return fd.write(buffer, 0, buffer.length);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 8);
        assert.equal(result.buffer, buffer);
        assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
        done();
      })
      .catch(done);
  });

  it('writes a buffer to a file with implicit offset, length, position', function (done) {
    const fd = fs.openSync('path/new-file.txt', 'w');
    const buffer = Buffer.from('new file');
    fs.write(fd, buffer, function (err, written, buf) {
      if (err) {
        return done(err);
      }
      assert.equal(written, 8);
      assert.equal(buf, buffer);
      assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
      done();
    });
  });

  it('promise writes a buffer to a file with implicit offset, length, position', function (done) {
    const buffer = Buffer.from('new file');
    fs.promises
      .open('path/new-file.txt', 'w')
      .then(function (fd) {
        return fd.write(buffer);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 8);
        assert.equal(result.buffer, buffer);
        assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
        done();
      })
      .catch(done);
  });

  it('can write a portion of a buffer to a file', function (done) {
    fs.open('path/new-file.txt', 'w', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.from('new file');
      fs.write(fd, buffer, 1, 5, null, function (err2, written, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(buf, buffer);
        assert.equal(String(fs.readFileSync('path/new-file.txt')), 'ew fi');
        done();
      });
    });
  });

  it('promise can write a portion of a buffer to a file', function (done) {
    const buffer = Buffer.from('new file');
    fs.promises
      .open('path/new-file.txt', 'w')
      .then(function (fd) {
        return fd.write(buffer, 1, 5);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(result.buffer, buffer);
        assert.equal(String(fs.readFileSync('path/new-file.txt')), 'ew fi');
        done();
      })
      .catch(done);
  });

  it('can write a portion of a buffer to a file position', function (done) {
    fs.open('path/to/file.txt', 'a', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.from('new file');
      fs.write(fd, buffer, 1, 5, 2, function (err2, written, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(buf, buffer);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'fiew fintent'
        );
        done();
      });
    });
  });

  it('promise can write a portion of a buffer to a file position', function (done) {
    const buffer = Buffer.from('new file');
    fs.promises
      .open('path/to/file.txt', 'a')
      .then(function (fd) {
        return fd.write(buffer, 1, 5, 2);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(result.buffer, buffer);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'fiew fintent'
        );
        done();
      })
      .catch(done);
  });

  it('can write a portion of a buffer to a file position and enlarge the file', function (done) {
    fs.open('path/to/file.txt', 'a', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.from('new file');
      fs.write(fd, buffer, 1, 5, 8, function (err2, written, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(buf, buffer);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'file conew fi'
        );
        done();
      });
    });
  });

  it('promise can write a portion of a buffer to a file position and enlarge the file', function (done) {
    const buffer = Buffer.from('new file');
    fs.promises
      .open('path/to/file.txt', 'a')
      .then(function (fd) {
        return fd.write(buffer, 1, 5, 8);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(result.buffer, buffer);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'file conew fi'
        );
        done();
      })
      .catch(done);
  });

  it('can append to a file', function (done) {
    fs.open('path/to/file.txt', 'a', function (err, fd) {
      if (err) {
        return done(err);
      }
      const buffer = Buffer.from(' more');
      fs.write(fd, buffer, 0, 5, null, function (err2, written, buf) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(buf, buffer);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'file content more'
        );
        done();
      });
    });
  });

  it('promise can append to a file', function (done) {
    const buffer = Buffer.from(' more');
    fs.promises
      .open('path/to/file.txt', 'a')
      .then(function (fd) {
        return fd.write(buffer, 0, 5);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(result.buffer, buffer);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'file content more'
        );
        done();
      })
      .catch(done);
  });

  it('fails if file not open for writing', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      fs.write(fd, Buffer.from('oops'), 0, 4, null, function (err2) {
        assert.instanceOf(err2, Error);
        assert.equal(err2.code, 'EBADF');
        done();
      });
    });
  });

  it('fails if file not open for writing', function (done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.write(Buffer.from('oops'), 0, 4);
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

describe('fs.writeSync(fd, buffer, offset, length, position)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
    });
  });
  afterEach(mock.restore);

  it('writes a buffer to a file', function () {
    const buffer = Buffer.from('new file');
    const fd = fs.openSync('path/new-file.txt', 'w');
    const written = fs.writeSync(fd, buffer, 0, buffer.length);
    assert.equal(written, 8);
    assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
  });

  it('can write a portion of a buffer to a file', function () {
    const buffer = Buffer.from('new file');
    const fd = fs.openSync('path/new-file.txt', 'w');
    const written = fs.writeSync(fd, buffer, 1, 5);
    assert.equal(written, 5);
    assert.equal(String(fs.readFileSync('path/new-file.txt')), 'ew fi');
  });

  it('can append to a file', function () {
    const buffer = Buffer.from(' more');
    const fd = fs.openSync('path/to/file.txt', 'a');
    const written = fs.writeSync(fd, buffer, 0, 5);
    assert.equal(written, 5);
    assert.equal(
      String(fs.readFileSync('path/to/file.txt')),
      'file content more'
    );
  });

  it('fails if file not open for writing', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    assert.throws(function () {
      fs.writeSync(fd, Buffer.from('oops'), 0, 4);
    });
  });
});

describe('fs.write(fd, data[, position[, encoding]], callback)', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
    });
  });
  afterEach(mock.restore);

  it('writes a string to a file', function (done) {
    fs.open('path/new-file.txt', 'w', function (err, fd) {
      if (err) {
        return done(err);
      }
      const string = 'new file';
      fs.write(fd, string, null, 'utf-8', function (err2, written, str) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 8);
        assert.equal(str, string);
        assert.equal(fs.readFileSync('path/new-file.txt'), 'new file');
        done();
      });
    });
  });

  it('promise writes a string to a file', function (done) {
    const string = 'new file';
    fs.promises
      .open('path/new-file.txt', 'w')
      .then(function (fd) {
        return fd.write(string, null, 'utf-8');
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 8);
        assert.equal(String(result.buffer), string);
        assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
        done();
      })
      .catch(done);
  });

  it('writes a string to a file with implicit position and encoding', function (done) {
    fs.open('path/new-file.txt', 'w', function (err, fd) {
      if (err) {
        return done(err);
      }
      const string = 'new file';
      fs.write(fd, string, function (err2, written, str) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 8);
        assert.equal(str, string);
        assert.equal(fs.readFileSync('path/new-file.txt'), 'new file');
        done();
      });
    });
  });

  it('promise writes a string to a file with implicit position and encoding', function (done) {
    const string = 'new file';
    fs.promises
      .open('path/new-file.txt', 'w')
      .then(function (fd) {
        return fd.write(string);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 8);
        assert.equal(String(result.buffer), string);
        assert.equal(String(fs.readFileSync('path/new-file.txt')), 'new file');
        done();
      })
      .catch(done);
  });

  it('can append to a file', function (done) {
    fs.open('path/to/file.txt', 'a', function (err, fd) {
      if (err) {
        return done(err);
      }
      const string = ' more';
      fs.write(fd, string, null, 'utf-8', function (err2, written, str) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(str, string);
        assert.equal(fs.readFileSync('path/to/file.txt'), 'file content more');
        done();
      });
    });
  });

  it('promise can append to a file', function (done) {
    const string = ' more';
    fs.promises
      .open('path/to/file.txt', 'a')
      .then(function (fd) {
        return fd.write(string);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(String(result.buffer), string);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'file content more'
        );
        done();
      })
      .catch(done);
  });

  it('can write to a position of a file', function (done) {
    fs.open('path/to/file.txt', 'a', function (err, fd) {
      if (err) {
        return done(err);
      }
      const string = ' more';
      fs.write(fd, string, 3, function (err2, written, str) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(str, string);
        assert.equal(fs.readFileSync('path/to/file.txt'), 'fil moretent');
        done();
      });
    });
  });

  it('promise can write to a position of a file', function (done) {
    const string = ' more';
    fs.promises
      .open('path/to/file.txt', 'a')
      .then(function (fd) {
        return fd.write(string, 3);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(String(result.buffer), string);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'fil moretent'
        );
        done();
      })
      .catch(done);
  });

  it('can write to a position of a file and enlarge it', function (done) {
    fs.open('path/to/file.txt', 'a', function (err, fd) {
      if (err) {
        return done(err);
      }
      const string = ' more';
      fs.write(fd, string, 9, function (err2, written, str) {
        if (err2) {
          return done(err2);
        }
        assert.equal(written, 5);
        assert.equal(str, string);
        assert.equal(fs.readFileSync('path/to/file.txt'), 'file cont more');
        done();
      });
    });
  });

  it('promise can write to a position of a file and enlarge it', function (done) {
    const string = ' more';
    fs.promises
      .open('path/to/file.txt', 'a')
      .then(function (fd) {
        return fd.write(string, 9);
      })
      .then(function (result) {
        assert.equal(result.bytesWritten, 5);
        assert.equal(String(result.buffer), string);
        assert.equal(
          String(fs.readFileSync('path/to/file.txt')),
          'file cont more'
        );
        done();
      })
      .catch(done);
  });

  it('fails if file not open for writing', function (done) {
    fs.open('path/to/file.txt', 'r', function (err, fd) {
      if (err) {
        return done(err);
      }
      fs.write(fd, 'oops', null, 'utf-8', function (err2) {
        assert.instanceOf(err2, Error);
        done();
      });
    });
  });

  it('promise fails if file not open for writing', function (done) {
    fs.promises
      .open('path/to/file.txt', 'r')
      .then(function (fd) {
        return fd.write('oops');
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

describe('fs.writeSync(fd, data[, position[, encoding]])', function () {
  beforeEach(function () {
    mock({
      'path/to/file.txt': 'file content',
    });
  });
  afterEach(mock.restore);

  it('writes a string to a file', function () {
    const fd = fs.openSync('path/new-file.txt', 'w');
    const string = 'new file';
    const written = fs.writeSync(fd, string, null, 'utf-8');
    assert.equal(written, 8);
    assert.equal(fs.readFileSync('path/new-file.txt'), 'new file');
  });

  it('can append to a file', function () {
    const fd = fs.openSync('path/to/file.txt', 'a');
    const string = ' more';
    const written = fs.writeSync(fd, string, null, 'utf-8');
    assert.equal(written, 5);
    assert.equal(fs.readFileSync('path/to/file.txt'), 'file content more');
  });

  it('fails if file not open for writing', function () {
    const fd = fs.openSync('path/to/file.txt', 'r');
    assert.throws(function () {
      fs.writeSync(fd, 'oops', null, 'utf-8');
    });
  });
});
