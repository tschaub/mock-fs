'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const inVersion = helper.inVersion;
const withPromise = helper.withPromise;

const testParentPerms =
  fs.access && fs.accessSync && process.getuid && process.getgid;

function setup() {
  mock({
    'path/to/empty': {},
    'path2/to': {
      empty: {
        deep: {}
      },
      'non-empty': {
        deep: {
          'b.file': 'lorem'
        },
        'a.file': ''
      }
    },
    'file.txt': 'content',
    unwriteable: mock.directory({
      mode: parseInt('0555', 8),
      items: {child: {}}
    })
  });
}

describe('fs.rmdir(path, callback)', function() {
  beforeEach(setup);
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

  it('supports Buffer input', function(done) {
    assert.equal(fs.statSync('path/to').nlink, 3);

    fs.rmdir(Buffer.from('path/to/empty'), function(err) {
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
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOTEMPTY');
        done();
      }
    );
  });

  it('fails if file', function(done) {
    fs.rmdir('file.txt', function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOTDIR');
      done();
    });
  });

  withPromise.it('promise fails if file', function(done) {
    fs.promises.rmdir('file.txt').then(
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

  inVersion('>=12.10').run(function() {
    it('recursively remove empty directory', function(done) {
      assert.equal(fs.statSync('path2/to').nlink, 4);

      fs.rmdir('path2/to/empty', {recursive: true}, function(err) {
        if (err) {
          return done(err);
        }
        assert.isFalse(fs.existsSync('path2/to/empty'));
        assert.equal(fs.statSync('path2/to').nlink, 3);
        done();
      });
    });

    it('promise recursively remove empty directory', function(done) {
      assert.equal(fs.statSync('path2/to').nlink, 4);

      fs.promises.rmdir('path2/to/empty', {recursive: true}).then(function() {
        assert.isFalse(fs.existsSync('path2/to/empty'));
        assert.equal(fs.statSync('path2/to').nlink, 3);
        done();
      }, done);
    });

    it('recursively remove non-empty directory', function(done) {
      assert.equal(fs.statSync('path2/to').nlink, 4);

      fs.rmdir('path2/to/non-empty', {recursive: true}, function(err) {
        if (err) {
          return done(err);
        }
        assert.isFalse(fs.existsSync('path2/to/non-empty'));
        assert.equal(fs.statSync('path2/to').nlink, 3);
        done();
      });
    });

    it('promise recursively remove non-empty directory', function(done) {
      assert.equal(fs.statSync('path2/to').nlink, 4);

      fs.promises
        .rmdir('path2/to/non-empty', {recursive: true})
        .then(function() {
          assert.isFalse(fs.existsSync('path2/to/non-empty'));
          assert.equal(fs.statSync('path2/to').nlink, 3);
          done();
        }, done);
    });
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

describe('fs.rmdirSync(path)', function() {
  beforeEach(setup);
  afterEach(mock.restore);

  it('removes an empty directory', function() {
    fs.rmdirSync('path/to/empty');
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

  inVersion('>=12.10').run(function() {
    it('recursively remove empty directory', function() {
      assert.equal(fs.statSync('path2/to').nlink, 4);
      fs.rmdirSync('path2/to/empty', {recursive: true});
      assert.isFalse(fs.existsSync('path2/to/empty'));
      assert.equal(fs.statSync('path2/to').nlink, 3);
    });

    it('recursively remove non-empty directory', function() {
      assert.equal(fs.statSync('path2/to').nlink, 4);
      fs.rmdirSync('path2/to/non-empty', {recursive: true});
      assert.isFalse(fs.existsSync('path2/to/non-empty'));
      assert.equal(fs.statSync('path2/to').nlink, 3);
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
