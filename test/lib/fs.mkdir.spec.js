'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;

const testParentPerms = process.getuid && process.getgid;

describe('fs.mkdir(path, [mode], callback)', function() {
  beforeEach(function() {
    mock({
      parent: {
        'file.md': '',
        child: {}
      },
      'file.txt': '',
      unwriteable: mock.directory({mode: parseInt('0555', 8)})
    });
  });
  afterEach(mock.restore);

  it('creates a new directory', function(done) {
    fs.mkdir('parent/dir', function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('parent/dir');
      assert.isTrue(stats.isDirectory());
      done();
    });
  });

  it('supports Buffer input', function(done) {
    fs.mkdir(Buffer.from('parent/dir'), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('parent/dir');
      assert.isTrue(stats.isDirectory());
      done();
    });
  });

  it('promise creates a new directory', function(done) {
    fs.promises.mkdir('parent/dir').then(function() {
      const stats = fs.statSync('parent/dir');
      assert.isTrue(stats.isDirectory());
      done();
    }, done);
  });

  it('creates a new directory recursively', function(done) {
    fs.mkdir('parent/foo/bar/dir', {recursive: true}, function(err) {
      if (err) {
        return done(err);
      }
      let stats = fs.statSync('parent/foo/bar/dir');
      assert.isTrue(stats.isDirectory());
      stats = fs.statSync('parent/foo/bar');
      assert.isTrue(stats.isDirectory());
      stats = fs.statSync('parent/foo');
      assert.isTrue(stats.isDirectory());
      done();
    });
  });

  it('promise creates a new directory recursively', function(done) {
    fs.promises.mkdir('parent/foo/bar/dir', {recursive: true}).then(function() {
      let stats = fs.statSync('parent/foo/bar/dir');
      assert.isTrue(stats.isDirectory());
      stats = fs.statSync('parent/foo/bar');
      assert.isTrue(stats.isDirectory());
      stats = fs.statSync('parent/foo');
      assert.isTrue(stats.isDirectory());
      done();
    }, done);
  });

  it('accepts dir mode', function(done) {
    fs.mkdir('parent/dir', parseInt('0755', 8), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('parent/dir');
      assert.isTrue(stats.isDirectory());
      assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));
      done();
    });
  });

  it('promise accepts dir mode', function(done) {
    fs.promises.mkdir('parent/dir', parseInt('0755', 8)).then(function() {
      const stats = fs.statSync('parent/dir');
      assert.isTrue(stats.isDirectory());
      assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));
      done();
    }, done);
  });

  it('accepts dir mode recursively', function(done) {
    fs.mkdir(
      'parent/foo/bar/dir',
      {recursive: true, mode: parseInt('0755', 8)},
      function(err) {
        if (err) {
          return done(err);
        }
        let stats = fs.statSync('parent/foo/bar/dir');
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));

        stats = fs.statSync('parent/foo/bar');
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));

        stats = fs.statSync('parent/foo');
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));
        done();
      }
    );
  });

  it('promise accepts dir mode recursively', function(done) {
    fs.promises
      .mkdir('parent/foo/bar/dir', {recursive: true, mode: parseInt('0755', 8)})
      .then(function() {
        let stats = fs.statSync('parent/foo/bar/dir');
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));

        stats = fs.statSync('parent/foo/bar');
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));

        stats = fs.statSync('parent/foo');
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));
        done();
      }, done);
  });

  it('fails if parent does not exist', function(done) {
    fs.mkdir('parent/bogus/dir', function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('promise fails if parent does not exist', function(done) {
    fs.promises.mkdir('parent/bogus/dir').then(
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

  it('fails if one parent is not a folder in recursive creation', function(done) {
    fs.mkdir('file.txt/bogus/dir', {recursive: true}, function(err) {
      assert.instanceOf(err, Error);
      done();
    });
  });

  it('promise fails if one parent is not a folder in recursive creation', function(done) {
    fs.promises.mkdir('file.txt/bogus/dir', {recursive: true}).then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        done();
      }
    );
  });

  it('fails if permission does not allow recursive creation', function(done) {
    fs.mkdir(
      'parent/foo/bar/dir',
      {recursive: true, mode: parseInt('0400', 8)},
      function(err) {
        assert.instanceOf(err, Error);
        done();
      }
    );
  });

  it('promise fails if permission does not allow recursive creation', function(done) {
    fs.promises
      .mkdir('parent/foo/bar/dir', {
        recursive: true,
        mode: parseInt('0400', 8)
      })
      .then(
        function() {
          done(new Error('should not succeed.'));
        },
        function(err) {
          assert.instanceOf(err, Error);
          done();
        }
      );
  });

  it('fails if directory already exists', function(done) {
    fs.mkdir('parent', function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EEXIST');
      done();
    });
  });

  it('promise fails if directory already exists', function(done) {
    fs.promises.mkdir('parent').then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EEXIST');
        done();
      }
    );
  });

  it('fails if file already exists', function(done) {
    fs.mkdir('file.txt', function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EEXIST');
      done();
    });
  });

  it('promise fails if file already exists', function(done) {
    fs.promises.mkdir('file.txt').then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EEXIST');
        done();
      }
    );
  });

  it('fails in recursive mode if file already exists', function(done) {
    fs.mkdir('parent/file.md', {recursive: true}, function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EEXIST');
      done();
    });
  });

  it('promise fails in recursive mode if file already exists', function(done) {
    fs.promises.mkdir('parent/file.md', {recursive: true}).then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EEXIST');
        done();
      }
    );
  });

  it('passes in recursive mode if directory already exists', function(done) {
    fs.mkdir('parent/child', {recursive: true}, function(err) {
      assert.isNotOk(err, Error);
      done();
    });
  });

  it('promise passes in recursive mode if directory already exists', function(done) {
    fs.promises.mkdir('parent/child', {recursive: true}).then(done, done);
  });

  if (testParentPerms) {
    it('fails if parent is not writeable', function(done) {
      fs.mkdir('unwriteable/child', function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      });
    });

    it('promise fails if parent is not writeable', function(done) {
      fs.promises.mkdir('unwriteable/child').then(
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

  it('calls callback with a single argument on success', function(done) {
    fs.mkdir('parent/arity', function(_) {
      assert.equal(arguments.length, 1);
      done();
    });
  });

  it('calls callback with a single argument on failure', function(done) {
    fs.mkdir('parent', function(err) {
      assert.instanceOf(err, Error);
      done();
    });
  });
});

describe('fs.mkdirSync(path, [mode])', function() {
  beforeEach(function() {
    mock({
      parent: {
        'file.md': '',
        child: {}
      },
      'file.txt': 'content',
      unwriteable: mock.directory({mode: parseInt('0555', 8)})
    });
  });
  afterEach(mock.restore);

  it('creates a new directory', function() {
    fs.mkdirSync('parent/dir');
    const stats = fs.statSync('parent/dir');
    assert.isTrue(stats.isDirectory());
  });

  it('creates a new directory recursively', function() {
    fs.mkdirSync('parent/foo/bar/dir', {recursive: true});
    let stats = fs.statSync('parent/foo/bar/dir');
    assert.isTrue(stats.isDirectory());
    stats = fs.statSync('parent/foo/bar');
    assert.isTrue(stats.isDirectory());
    stats = fs.statSync('parent/foo');
    assert.isTrue(stats.isDirectory());
  });

  it('accepts dir mode', function() {
    fs.mkdirSync('parent/dir', parseInt('0755', 8));
    const stats = fs.statSync('parent/dir');
    assert.isTrue(stats.isDirectory());
    assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));
  });

  it('accepts dir mode recursively', function() {
    fs.mkdirSync('parent/foo/bar/dir', {
      recursive: true,
      mode: parseInt('0755', 8)
    });
    let stats = fs.statSync('parent/foo/bar/dir');
    assert.isTrue(stats.isDirectory());
    assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));

    stats = fs.statSync('parent/foo/bar');
    assert.isTrue(stats.isDirectory());
    assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));

    stats = fs.statSync('parent/foo');
    assert.isTrue(stats.isDirectory());
    assert.equal(stats.mode & parseInt('0777', 8), parseInt('0755', 8));
  });

  it('fails if parent does not exist', function() {
    assert.throws(function() {
      fs.mkdirSync('parent/bogus/dir');
    });
  });

  it('fails if one parent is not a folder in recursive creation', function() {
    assert.throws(function() {
      fs.mkdirSync('file.txt/bogus/dir', {recursive: true});
    });
  });

  it('fails if permission does not allow recursive creation', function() {
    assert.throws(function() {
      fs.mkdirSync('parent/foo/bar/dir', {
        recursive: true,
        mode: parseInt('0400', 8)
      });
    });
  });

  it('fails if directory already exists', function() {
    assert.throws(function() {
      fs.mkdirSync('parent');
    });
  });

  it('fails if file already exists', function() {
    assert.throws(function() {
      fs.mkdirSync('file.txt');
    });
  });

  it('fails in recursive mode if file already exists', function() {
    assert.throws(function() {
      fs.mkdirSync('parent/file.md', {recursive: true});
    });
  });

  it('passes in recursive mode if directory already exists', function() {
    assert.doesNotThrow(function() {
      fs.mkdirSync('parent/child', {recursive: true});
    });
  });

  if (testParentPerms) {
    it('fails if parent is not writeable', function() {
      assert.throws(function() {
        fs.mkdirSync('unwriteable/child');
      });
    });
  }
});
