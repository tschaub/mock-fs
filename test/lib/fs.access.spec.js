'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const assert = helper.assert;
const withPromise = helper.withPromise;

if (fs.access && fs.accessSync && process.getuid && process.getgid) {
  // TODO: drop condition when dropping Node < 0.12 support
  // TODO: figure out how fs.access() works on Windows (without gid/uid)

  describe('fs.access(path[, mode], callback)', function() {
    beforeEach(function() {
      mock({
        'path/to/accessible/file': 'can access',
        'path/to/000': mock.file({
          mode: parseInt('0000', 8),
          content: 'no permissions'
        }),
        'path/to/111': mock.file({
          mode: parseInt('0111', 8),
          content: 'execute only'
        }),
        'path/to/write/only': mock.file({
          mode: parseInt('0222', 8),
          content: 'write only'
        }),
        'path/to/333': mock.file({
          mode: parseInt('0333', 8),
          content: 'write and execute'
        }),
        'path/to/444': mock.file({
          mode: parseInt('0444', 8),
          content: 'read only'
        }),
        'path/to/555': mock.file({
          mode: parseInt('0555', 8),
          content: 'read and execute'
        }),
        'path/to/666': mock.file({
          mode: parseInt('0666', 8),
          content: 'read and write'
        }),
        'path/to/777': mock.file({
          mode: parseInt('0777', 8),
          content: 'read, write, and execute'
        }),
        unreadable: mock.directory({
          mode: parseInt('0000', 8),
          items: {
            'readable-child': mock.file({
              mode: parseInt('0777', 8),
              content: 'read, write, and execute'
            })
          }
        })
      });
    });
    afterEach(mock.restore);

    it('works for an accessible file', function(done) {
      fs.access('path/to/accessible/file', done);
    });

    it('supports Buffer input', function(done) {
      fs.access(Buffer.from('path/to/accessible/file'), done);
    });

    withPromise.it('promise works for an accessible file', function(done) {
      fs.promises.access('path/to/accessible/file').then(done, done);
    });

    it('works 000 (and no mode arg)', function(done) {
      fs.access('path/to/000', done);
    });

    withPromise.it('promise works 000 (and no mode arg)', function(done) {
      fs.promises.access('path/to/000').then(done, done);
    });

    it('works F_OK and 000', function(done) {
      fs.access('path/to/000', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 000', function(done) {
      fs.promises.access('path/to/000', fs.F_OK).then(done, done);
    });

    it('generates EACCES for R_OK and 000', function(done) {
      fs.access('path/to/000', fs.R_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for R_OK and 000', function(done) {
      fs.promises.access('path/to/000', fs.R_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('generates EACCES for W_OK and 000', function(done) {
      fs.access('path/to/000', fs.W_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for W_OK and 000', function(done) {
      fs.promises.access('path/to/000', fs.W_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('generates EACCES for X_OK and 000', function(done) {
      fs.access('path/to/000', fs.X_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for X_OK and 000', function(done) {
      fs.promises.access('path/to/000', fs.X_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works 111 (and no mode arg)', function(done) {
      fs.access('path/to/111', done);
    });

    withPromise.it('promise works 111 (and no mode arg)', function(done) {
      fs.promises.access('path/to/111').then(done, done);
    });

    it('works F_OK and 111', function(done) {
      fs.access('path/to/111', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 111', function(done) {
      fs.promises.access('path/to/111', fs.F_OK).then(done, done);
    });

    it('works X_OK and 111', function(done) {
      fs.access('path/to/111', fs.X_OK, done);
    });

    withPromise.it('promise works X_OK and 111', function(done) {
      fs.promises.access('path/to/111', fs.X_OK).then(done, done);
    });

    it('generates EACCES for R_OK and 111', function(done) {
      fs.access('path/to/111', fs.R_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for R_OK and 111', function(done) {
      fs.promises.access('path/to/111', fs.R_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('generates EACCES for W_OK and 111', function(done) {
      fs.access('path/to/111', fs.W_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for W_OK and 111', function(done) {
      fs.promises.access('path/to/111', fs.W_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works for 222 (and no mode arg)', function(done) {
      fs.access('path/to/write/only', done);
    });

    withPromise.it('promise works for 222 (and no mode arg)', function(done) {
      fs.promises.access('path/to/write/only').then(done, done);
    });

    it('works F_OK and 222', function(done) {
      fs.access('path/to/write/only', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 222', function(done) {
      fs.promises.access('path/to/write/only', fs.F_OK).then(done, done);
    });

    it('works W_OK and 222', function(done) {
      fs.access('path/to/write/only', fs.W_OK, done);
    });

    withPromise.it('promise works W_OK and 222', function(done) {
      fs.promises.access('path/to/write/only', fs.W_OK).then(done, done);
    });

    it('generates EACCES for R_OK and 222', function(done) {
      fs.access('path/to/write/only', fs.R_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for R_OK and 222', function(done) {
      fs.promises.access('path/to/write/only', fs.R_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('generates EACCES for X_OK and 222', function(done) {
      fs.access('path/to/write/only', fs.X_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for X_OK and 222', function(done) {
      fs.promises.access('path/to/write/only', fs.X_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works for 333 (and no mode arg)', function(done) {
      fs.access('path/to/333', done);
    });

    withPromise.it('promise works for 333 (and no mode arg)', function(done) {
      fs.promises.access('path/to/333').then(done, done);
    });

    it('works F_OK and 333', function(done) {
      fs.access('path/to/333', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 333', function(done) {
      fs.promises.access('path/to/333', fs.F_OK).then(done, done);
    });

    it('works W_OK and 333', function(done) {
      fs.access('path/to/333', fs.W_OK, done);
    });

    withPromise.it('promise works W_OK and 333', function(done) {
      fs.promises.access('path/to/333', fs.W_OK).then(done, done);
    });

    it('works X_OK and 333', function(done) {
      fs.access('path/to/333', fs.X_OK, done);
    });

    withPromise.it('promise works X_OK and 333', function(done) {
      fs.promises.access('path/to/333', fs.X_OK).then(done, done);
    });

    it('works X_OK | W_OK and 333', function(done) {
      fs.access('path/to/333', fs.X_OK | fs.W_OK, done);
    });

    withPromise.it('promise works X_OK | W_OK and 333', function(done) {
      fs.promises.access('path/to/333', fs.X_OK | fs.W_OK).then(done, done);
    });

    it('generates EACCES for R_OK and 333', function(done) {
      fs.access('path/to/333', fs.R_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for R_OK and 333', function(done) {
      fs.promises.access('path/to/333', fs.R_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works for 444 (and no mode arg)', function(done) {
      fs.access('path/to/444', done);
    });

    withPromise.it('promise works for 444 (and no mode arg)', function(done) {
      fs.promises.access('path/to/444').then(done, done);
    });

    it('works F_OK and 444', function(done) {
      fs.access('path/to/444', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 444', function(done) {
      fs.promises.access('path/to/444', fs.F_OK).then(done, done);
    });

    it('works R_OK and 444', function(done) {
      fs.access('path/to/444', fs.R_OK, done);
    });

    withPromise.it('promise works R_OK and 444', function(done) {
      fs.promises.access('path/to/444', fs.R_OK).then(done, done);
    });

    it('generates EACCES for W_OK and 444', function(done) {
      fs.access('path/to/444', fs.W_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for W_OK and 444', function(done) {
      fs.promises.access('path/to/444', fs.W_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('generates EACCES for X_OK and 444', function(done) {
      fs.access('path/to/444', fs.X_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for X_OK and 444', function(done) {
      fs.promises.access('path/to/444', fs.X_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works for 555 (and no mode arg)', function(done) {
      fs.access('path/to/555', done);
    });

    withPromise.it('promise works for 555 (and no mode arg)', function(done) {
      fs.promises.access('path/to/555').then(done, done);
    });

    it('works F_OK and 555', function(done) {
      fs.access('path/to/555', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 555', function(done) {
      fs.promises.access('path/to/555', fs.F_OK).then(done, done);
    });

    it('works R_OK and 555', function(done) {
      fs.access('path/to/555', fs.R_OK, done);
    });

    withPromise.it('promise works R_OK and 555', function(done) {
      fs.promises.access('path/to/555', fs.R_OK).then(done, done);
    });

    it('works X_OK and 555', function(done) {
      fs.access('path/to/555', fs.X_OK, done);
    });

    withPromise.it('promise works X_OK and 555', function(done) {
      fs.promises.access('path/to/555', fs.X_OK).then(done, done);
    });

    it('works R_OK | X_OK and 555', function(done) {
      fs.access('path/to/555', fs.R_OK | fs.X_OK, done);
    });

    withPromise.it('promise works R_OK | X_OK and 555', function(done) {
      fs.promises.access('path/to/555', fs.R_OK | fs.X_OK).then(done, done);
    });

    it('generates EACCES for W_OK and 555', function(done) {
      fs.access('path/to/555', fs.W_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for W_OK and 555', function(done) {
      fs.promises.access('path/to/555', fs.W_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works for 666 (and no mode arg)', function(done) {
      fs.access('path/to/666', done);
    });

    withPromise.it('promise works for 666 (and no mode arg)', function(done) {
      fs.promises.access('path/to/666').then(done, done);
    });

    it('works F_OK and 666', function(done) {
      fs.access('path/to/666', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 666', function(done) {
      fs.promises.access('path/to/666', fs.F_OK).then(done, done);
    });

    it('works R_OK and 666', function(done) {
      fs.access('path/to/666', fs.R_OK, done);
    });

    withPromise.it('promise works R_OK and 666', function(done) {
      fs.promises.access('path/to/666', fs.R_OK).then(done, done);
    });

    it('works W_OK and 666', function(done) {
      fs.access('path/to/666', fs.W_OK, done);
    });

    withPromise.it('promise works W_OK and 666', function(done) {
      fs.promises.access('path/to/666', fs.W_OK).then(done, done);
    });

    it('works R_OK | W_OK and 666', function(done) {
      fs.access('path/to/666', fs.R_OK | fs.W_OK, done);
    });

    withPromise.it('promise works R_OK | W_OK and 666', function(done) {
      fs.promises.access('path/to/666', fs.R_OK | fs.W_OK).then(done, done);
    });

    it('generates EACCES for X_OK and 666', function(done) {
      fs.access('path/to/666', fs.X_OK, function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise generates EACCES for X_OK and 666', function(done) {
      fs.promises.access('path/to/666', fs.X_OK).then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EACCES');
          done();
        }
      );
    });

    it('works for 777 (and no mode arg)', function(done) {
      fs.access('path/to/777', done);
    });

    withPromise.it('promise works for 777 (and no mode arg)', function(done) {
      fs.promises.access('path/to/777').then(done, done);
    });

    it('works F_OK and 777', function(done) {
      fs.access('path/to/777', fs.F_OK, done);
    });

    withPromise.it('promise works F_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.F_OK).then(done, done);
    });

    it('works R_OK and 777', function(done) {
      fs.access('path/to/777', fs.R_OK, done);
    });

    withPromise.it('promise works R_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.R_OK).then(done, done);
    });

    it('works W_OK and 777', function(done) {
      fs.access('path/to/777', fs.W_OK, done);
    });

    withPromise.it('promise works W_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.W_OK).then(done, done);
    });

    it('works X_OK and 777', function(done) {
      fs.access('path/to/777', fs.X_OK, done);
    });

    withPromise.it('promise works X_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.X_OK).then(done, done);
    });

    it('works X_OK | W_OK and 777', function(done) {
      fs.access('path/to/777', fs.X_OK | fs.W_OK, done);
    });

    withPromise.it('promise works X_OK | W_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.X_OK | fs.W_OK).then(done, done);
    });

    it('works X_OK | R_OK and 777', function(done) {
      fs.access('path/to/777', fs.X_OK | fs.R_OK, done);
    });

    withPromise.it('promise works X_OK | R_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.X_OK | fs.R_OK).then(done, done);
    });

    it('works R_OK | W_OK and 777', function(done) {
      fs.access('path/to/777', fs.R_OK | fs.W_OK, done);
    });

    withPromise.it('promise works R_OK | W_OK and 777', function(done) {
      fs.promises.access('path/to/777', fs.R_OK | fs.W_OK).then(done, done);
    });

    it('works R_OK | W_OK | X_OK and 777', function(done) {
      fs.access('path/to/777', fs.R_OK | fs.W_OK | fs.X_OK, done);
    });

    withPromise.it('promise works R_OK | W_OK | X_OK and 777', function(done) {
      fs.promises
        .access('path/to/777', fs.R_OK | fs.W_OK | fs.X_OK)
        .then(done, done);
    });

    it('generates EACCESS for F_OK and an unreadable parent', function(done) {
      fs.access('unreadable/readable-child', function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it(
      'promise generates EACCESS for F_OK and an unreadable parent',
      function(done) {
        fs.promises.access('unreadable/readable-child').then(
          function() {
            done(new Error('should not succeed.'));
          },
          function(err) {
            assert.instanceOf(err, Error);
            assert.equal(err.code, 'EACCES');
            done();
          }
        );
      }
    );
  });

  describe('fs.accessSync(path[, mode])', function() {
    beforeEach(function() {
      mock({
        'path/to/777': mock.file({
          mode: parseInt('0777', 8),
          content: 'all access'
        }),
        'path/to/000': mock.file({
          mode: parseInt('0000', 8),
          content: 'no permissions'
        }),
        'broken-link': mock.symlink({path: './path/to/nothing'}),
        'circular-link': mock.symlink({path: './loop-link'}),
        'loop-link': mock.symlink({path: './circular-link'})
      });
    });
    afterEach(mock.restore);

    it('works for an accessible file', function() {
      fs.accessSync('path/to/777');
      fs.accessSync('path/to/777', fs.F_OK);
      fs.accessSync('path/to/777', fs.X_OK);
      fs.accessSync('path/to/777', fs.W_OK);
      fs.accessSync('path/to/777', fs.X_OK | fs.W_OK);
      fs.accessSync('path/to/777', fs.R_OK);
      fs.accessSync('path/to/777', fs.X_OK | fs.R_OK);
      fs.accessSync('path/to/777', fs.W_OK | fs.R_OK);
      fs.accessSync('path/to/777', fs.X_OK | fs.W_OK | fs.R_OK);
    });

    it('throws EACCESS for broken link', function() {
      assert.throws(function() {
        fs.accessSync('broken-link');
      });
    });

    it('throws ELOOP for circular link', function() {
      assert.throws(function() {
        fs.accessSync('circular-link');
      });
    });

    it('throws EACCESS for all but F_OK for 000', function() {
      fs.accessSync('path/to/000');
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.X_OK);
      });
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.W_OK);
      });
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.X_OK | fs.W_OK);
      });
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.R_OK);
      });
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.X_OK | fs.R_OK);
      });
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.W_OK | fs.R_OK);
      });
      assert.throws(function() {
        fs.accessSync('path/to/000', fs.X_OK | fs.W_OK | fs.R_OK);
      });
    });
  });
}
