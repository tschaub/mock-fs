'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

const testParentPerms =
  fs.access && fs.accessSync && process.getuid && process.getgid;

describe('fs.rmdir(path, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/empty': {},
      unwriteable: mock.directory({
        mode: parseInt('0555', 8),
        items: {child: {}}
      })
    });
  });
  afterEach(mock.restore);

  it('removes an empty directory', function(done) {
    assert.equal(fs.statSync('path/to').nlink, 3);

    fs.rmdir('path/to/empty', function(err) {
      if (err) {
        return done(err);
      }
      assert.isFalse(fs.existsSync('path/to/empty'));
      assert.equal(fs.statSync('path/to').nlink, 2);
      done();
    });
  });

  withPromise.it('promise removes an empty directory', function(done) {
    assert.equal(fs.statSync('path/to').nlink, 3);

    fs.promises.rmdir('path/to/empty').then(function() {
      assert.isFalse(fs.existsSync('path/to/empty'));
      assert.equal(fs.statSync('path/to').nlink, 2);
      done();
    }, done);
  });

  it('fails if not empty', function(done) {
    fs.rmdir('path/to', function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOTEMPTY');
      done();
    });
  });

  withPromise.it('promise fails if not empty', function(done) {
    fs.promises.rmdir('path/to').then(
      function() {
        assert.fail('should not succeed.');
        done();
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOTEMPTY');
        done();
      }
    );
  });

  if (testParentPerms) {
    it('fails if parent is not writeable', function(done) {
      fs.rmdir('unwriteable/child', function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    withPromise.it('promise fails if parent is not writeable', function(done) {
      fs.promises.rmdir('unwriteable/child').then(
        function() {
          assert.fail('should not succeed.');
          done();
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

describe('fs.rmdirSync(path)', function() {
  beforeEach(function() {
    mock({
      'path/empty': {},
      'file.txt': 'content',
      unwriteable: mock.directory({
        mode: parseInt('0555', 8),
        items: {child: {}}
      })
    });
  });
  afterEach(mock.restore);

  it('removes an empty directory', function() {
    fs.rmdirSync('path/empty');
    assert.isFalse(fs.existsSync('path/empty'));
  });

  it('fails if directory does not exist', function() {
    assert.throws(function() {
      fs.rmdirSync('path/bogus');
    });
  });

  it('fails if not empty', function() {
    assert.throws(function() {
      fs.rmdirSync('path');
    });
  });

  it('fails if file', function() {
    assert.throws(function() {
      fs.rmdirSync('file.txt');
    });
  });

  if (testParentPerms) {
    it('fails if parent is not writeable', function() {
      assert.throws(function() {
        fs.rmdirSync('unwriteable/child');
      });
    });
  }
});
