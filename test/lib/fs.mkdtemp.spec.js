'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const path = require('path');

const assert = helper.assert;

const testParentPerms =
  fs.access && fs.accessSync && process.getuid && process.getgid;

if (fs.mkdtemp) {
  describe('fs.mkdtemp(prefix[, options], callback)', function() {
    beforeEach(function() {
      mock({
        parent: {},
        file: 'contents',
        unwriteable: mock.directory({mode: parseInt('0555', 8)})
      });
    });
    afterEach(mock.restore);

    it('creates a new directory', function(done) {
      fs.mkdtemp('parent/dir', function(err, dirPath) {
        if (err) {
          return done(err);
        }
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      });
    });

    it('promise creates a new directory', function(done) {
      fs.promises.mkdtemp('parent/dir').then(function(dirPath) {
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      }, done);
    });

    it('accepts a "utf8" encoding argument', function(done) {
      fs.mkdtemp('parent/dir', 'utf8', function(err, dirPath) {
        if (err) {
          return done(err);
        }
        assert.isString(dirPath);
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      });
    });

    it('promise accepts a "utf8" encoding argument', function(done) {
      fs.promises.mkdtemp('parent/dir', 'utf8').then(function(dirPath) {
        assert.isString(dirPath);
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      }, done);
    });

    it('accepts a "buffer" encoding argument', function(done) {
      fs.mkdtemp('parent/dir', 'buffer', function(err, buffer) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(buffer, Buffer);
        const dirPath = buffer.toString();
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      });
    });

    it('promise accepts a "buffer" encoding argument', function(done) {
      fs.promises.mkdtemp('parent/dir', 'buffer').then(function(buffer) {
        assert.instanceOf(buffer, Buffer);
        const dirPath = buffer.toString();
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      }, done);
    });

    it('accepts an options argument with "utf8" encoding', function(done) {
      fs.mkdtemp('parent/dir', {encoding: 'utf8'}, function(err, dirPath) {
        if (err) {
          return done(err);
        }
        assert.isString(dirPath);
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      });
    });

    it('promise accepts an options argument with "utf8" encoding', function(done) {
      fs.promises
        .mkdtemp('parent/dir', {encoding: 'utf8'})
        .then(function(dirPath) {
          assert.isString(dirPath);
          const parentPath = path.dirname(dirPath);
          assert.equal(parentPath, 'parent');
          const stats = fs.statSync(dirPath);
          assert.isTrue(stats.isDirectory());
          done();
        }, done);
    });

    it('accepts an options argument with "buffer" encoding', function(done) {
      fs.mkdtemp('parent/dir', {encoding: 'buffer'}, function(err, buffer) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(buffer, Buffer);
        const dirPath = buffer.toString();
        const parentPath = path.dirname(dirPath);
        assert.equal(parentPath, 'parent');
        const stats = fs.statSync(dirPath);
        assert.isTrue(stats.isDirectory());
        done();
      });
    });

    it('promise accepts an options argument with "buffer" encoding', function(done) {
      fs.promises
        .mkdtemp('parent/dir', {encoding: 'buffer'})
        .then(function(buffer) {
          assert.instanceOf(buffer, Buffer);
          const dirPath = buffer.toString();
          const parentPath = path.dirname(dirPath);
          assert.equal(parentPath, 'parent');
          const stats = fs.statSync(dirPath);
          assert.isTrue(stats.isDirectory());
          done();
        }, done);
    });

    it('fails if parent does not exist', function(done) {
      fs.mkdtemp('unknown/child', function(err, dirPath) {
        if (!err || dirPath) {
          done(new Error('Expected failure'));
        } else {
          assert.isTrue(!dirPath);
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'ENOENT');
          done();
        }
      });
    });

    it('promise fails if parent does not exist', function(done) {
      fs.promises.mkdtemp('unknown/child').then(
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

    it('fails if parent is a file', function(done) {
      fs.mkdtemp('file/child', function(err, dirPath) {
        if (!err || dirPath) {
          done(new Error('Expected failure'));
        } else {
          assert.isTrue(!dirPath);
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'ENOTDIR');
          done();
        }
      });
    });

    it('promise fails if parent is a file', function(done) {
      fs.promises.mkdtemp('file/child').then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'ENOTDIR');
          done();
        }
      );
    });

    if (testParentPerms) {
      it('fails if parent is not writeable', function(done) {
        fs.mkdtemp('unwriteable/child', function(err, dirPath) {
          if (!err || dirPath) {
            done(new Error('Expected failure'));
          } else {
            assert.isTrue(!dirPath);
            assert.instanceOf(err, Error);
            assert.equal(err.code, 'EACCES');
            done();
          }
        });
      });

      it('promise fails if parent is not writeable', function(done) {
        fs.promises.mkdtemp('unwriteable/child').then(
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
    }
  });
}

if (fs.mkdtempSync) {
  describe('fs.mkdtempSync(prefix[, options])', function() {
    beforeEach(function() {
      mock({
        parent: {},
        file: 'contents',
        unwriteable: mock.directory({mode: parseInt('0555', 8)})
      });
    });
    afterEach(mock.restore);

    it('creates a new directory', function() {
      const dirPath = fs.mkdtempSync('parent/dir');
      const parentPath = path.dirname(dirPath);
      assert.equal(parentPath, 'parent');
      const stats = fs.statSync(dirPath);
      assert.isTrue(stats.isDirectory());
    });

    it('accepts a "utf8" encoding argument', function() {
      const dirPath = fs.mkdtempSync('parent/dir', 'utf8');
      assert.isString(dirPath);
      const parentPath = path.dirname(dirPath);
      assert.equal(parentPath, 'parent');
      const stats = fs.statSync(dirPath);
      assert.isTrue(stats.isDirectory());
    });

    it('accepts a "buffer" encoding argument', function() {
      const buffer = fs.mkdtempSync('parent/dir', 'buffer');
      assert.instanceOf(buffer, Buffer);
      const dirPath = buffer.toString();
      const parentPath = path.dirname(dirPath);
      assert.equal(parentPath, 'parent');
      const stats = fs.statSync(dirPath);
      assert.isTrue(stats.isDirectory());
    });

    it('accepts an options argument with "utf8" encoding', function() {
      const dirPath = fs.mkdtempSync('parent/dir', {encoding: 'utf8'});
      assert.isString(dirPath);
      const parentPath = path.dirname(dirPath);
      assert.equal(parentPath, 'parent');
      const stats = fs.statSync(dirPath);
      assert.isTrue(stats.isDirectory());
    });

    it('accepts an options argument with "buffer" encoding', function() {
      const buffer = fs.mkdtempSync('parent/dir', {encoding: 'buffer'});
      assert.instanceOf(buffer, Buffer);
      const dirPath = buffer.toString();
      const parentPath = path.dirname(dirPath);
      assert.equal(parentPath, 'parent');
      const stats = fs.statSync(dirPath);
      assert.isTrue(stats.isDirectory());
    });

    it('fails if parent does not exist', function() {
      assert.throws(function() {
        fs.mkdtempSync('unknown/child');
      });
    });

    it('fails if parent is a file', function() {
      assert.throws(function() {
        fs.mkdtempSync('file/child');
      });
    });

    if (testParentPerms) {
      it('fails if parent is not writeable', function() {
        assert.throws(function() {
          fs.mkdtempSync('unwriteable/child');
        });
      });
    }
  });
}
