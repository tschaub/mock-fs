'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.open(path, flags, [mode], callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      nested: {
        sub: {
          dir: {
            'one.txt': 'one content',
            'two.txt': 'two content',
            empty: {}
          }
        }
      }
    });
  });
  afterEach(mock.restore);

  it('opens an existing file for reading (r)', function(done) {
    fs.open('nested/sub/dir/one.txt', 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      assert.isNumber(fd);
      done();
    });
  });

  it('supports Buffer input', function(done) {
    fs.open(Buffer.from('nested/sub/dir/one.txt'), 'r', function(err, fd) {
      if (err) {
        return done(err);
      }
      assert.isNumber(fd);
      done();
    });
  });

  withPromise.it('promise opens an existing file for reading (r)', function(
    done
  ) {
    fs.promises.open('nested/sub/dir/one.txt', 'r').then(function(fd) {
      assert.isNumber(fd.fd);
      done();
    }, done);
  });

  it('fails if file does not exist (r)', function(done) {
    fs.open('bogus.txt', 'r', function(err, fd) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  withPromise.it('promise fails if file does not exist (r)', function(done) {
    fs.promises.open('bogus.txt', 'r').then(
      function() {
        assert.fail('should not succeed.');
        done();
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      }
    );
  });

  it('creates a new file for writing (w)', function(done) {
    fs.open('path/to/new.txt', 'w', parseInt('0666', 8), function(err, fd) {
      if (err) {
        return done(err);
      }
      assert.isNumber(fd);
      assert.isTrue(fs.existsSync('path/to/new.txt'));
      done();
    });
  });

  withPromise.it('promise creates a new file for writing (w)', function(done) {
    fs.promises
      .open('path/to/new.txt', 'w', parseInt('0666', 8))
      .then(function(fd) {
        assert.isNumber(fd.fd);
        assert.isTrue(fs.existsSync('path/to/new.txt'));
        done();
      }, done);
  });

  it('opens an existing file for writing (w)', function(done) {
    fs.open('path/to/file.txt', 'w', parseInt('0666', 8), function(err, fd) {
      if (err) {
        return done(err);
      }
      assert.isNumber(fd);
      done();
    });
  });

  withPromise.it('promise opens an existing file for writing (w)', function(
    done
  ) {
    fs.promises
      .open('path/to/file.txt', 'w', parseInt('0666', 8))
      .then(function(fd) {
        assert.isNumber(fd.fd);
        done();
      }, done);
  });

  it('fails if file exists (wx)', function(done) {
    fs.open('path/to/file.txt', 'wx', parseInt('0666', 8), function(err, fd) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EEXIST');
      done();
    });
  });

  withPromise.it('promise fails if file exists (wx)', function(done) {
    fs.promises.open('path/to/file.txt', 'wx', parseInt('0666', 8)).then(
      function() {
        assert.fail('should not succeed.');
        done();
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EEXIST');
        done();
      }
    );
  });
});

describe('fs.openSync(path, flags, [mode])', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      nested: {
        sub: {
          dir: {
            'one.txt': 'one content',
            'two.txt': 'two content',
            empty: {}
          }
        }
      }
    });
  });
  afterEach(mock.restore);

  it('opens an existing file for reading (r)', function() {
    const fd = fs.openSync('path/to/file.txt', 'r');
    assert.isNumber(fd);
  });

  it('fails if file does not exist (r)', function() {
    assert.throws(function() {
      fs.openSync('bogus.txt', 'r');
    });
  });

  it('creates a new file for writing (w)', function() {
    const fd = fs.openSync('nested/sub/new.txt', 'w', parseInt('0666', 8));
    assert.isNumber(fd);
    assert.isTrue(fs.existsSync('nested/sub/new.txt'));
  });

  it('opens an existing file for writing (w)', function() {
    const fd = fs.openSync('path/to/one.txt', 'w', parseInt('0666', 8));
    assert.isNumber(fd);
  });

  it('fails if file exists (wx)', function() {
    assert.throws(function() {
      fs.openSync('path/to/file.txt', 'wx', parseInt('0666', 8));
    });
  });
});

describe('fs.close(fd, callback)', function() {
  beforeEach(function() {
    mock({dir: {}});
  });
  afterEach(mock.restore);

  it('closes a file descriptor', function(done) {
    const fd = fs.openSync('dir/file.txt', 'w');
    fs.close(fd, function(err) {
      done(err);
    });
  });

  withPromise.it('promise closes a file descriptor', function(done) {
    fs.promises
      .open('dir/file.txt', 'w')
      .then(function(fd) {
        return fd.close();
      })
      .then(done, done);
  });

  it('fails for closed file descriptors', function(done) {
    const fd = fs.openSync('dir/file.txt', 'w');
    fs.close(fd, function(err) {
      if (err) {
        return done(err);
      }
      fs.close(fd, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EBADF');
        done();
      });
    });
  });

  withPromise.it('promise fails for closed file descriptors', function(done) {
    fs.promises
      .open('dir/file.txt', 'w')
      .then(function(fd) {
        return fd.close().then(function() {
          return fd.close();
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

describe('fs.closeSync(fd)', function() {
  beforeEach(function() {
    mock({dir: {}});
  });
  afterEach(mock.restore);

  it('closes a file descriptor', function() {
    const fd = fs.openSync('dir/file.txt', 'w');
    fs.closeSync(fd);
  });

  it('fails for closed file descriptors', function() {
    const fd = fs.openSync('dir/file.txt', 'w');
    fs.closeSync(fd);
    assert.throws(function() {
      fs.closeSync(fd);
    });
  });
});
