'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const bufferFrom = require('../../lib/buffer').from;

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.rename(oldPath, newPath, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/a.bin': bufferFrom([1, 2, 3]),
      empty: {},
      nested: {
        dir: mock.directory({
          mtime: new Date(1),
          items: {'file.txt': ''}
        })
      }
    });
  });
  afterEach(mock.restore);

  it('allows files to be renamed', function(done) {
    fs.rename('path/to/a.bin', 'path/to/b.bin', function(err) {
      assert.isTrue(!err);
      assert.isFalse(fs.existsSync('path/to/a.bin'));
      assert.isTrue(fs.existsSync('path/to/b.bin'));
      done();
    });
  });

  withPromise.it('promise allows files to be renamed', function(done) {
    fs.promises.rename('path/to/a.bin', 'path/to/b.bin').then(function() {
      assert.isFalse(fs.existsSync('path/to/a.bin'));
      assert.isTrue(fs.existsSync('path/to/b.bin'));
      done();
    }, done);
  });

  it('updates mtime of parent directory', function(done) {
    const oldTime = fs.statSync('nested/dir').mtime;
    fs.rename('nested/dir/file.txt', 'nested/dir/renamed.txt', function(err) {
      assert.isTrue(!err);
      assert.isFalse(fs.existsSync('nested/dir/file.txt'));
      assert.isTrue(fs.existsSync('nested/dir/renamed.txt'));
      const newTime = fs.statSync('nested/dir').mtime;
      assert.isTrue(newTime > oldTime);
      done();
    });
  });

  withPromise.it('promise updates mtime of parent directory', function(done) {
    const oldTime = fs.statSync('nested/dir').mtime;
    fs.promises
      .rename('nested/dir/file.txt', 'nested/dir/renamed.txt')
      .then(function() {
        assert.isFalse(fs.existsSync('nested/dir/file.txt'));
        assert.isTrue(fs.existsSync('nested/dir/renamed.txt'));
        const newTime = fs.statSync('nested/dir').mtime;
        assert.isTrue(newTime > oldTime);
        done();
      }, done);
  });

  it('calls callback with error if old path does not exist', function(done) {
    fs.rename('bogus', 'empty', function(err) {
      assert.instanceOf(err, Error);
      done();
    });
  });

  withPromise.it(
    'promise calls callback with error if old path does not exist',
    function(done) {
      fs.promises.rename('bogus', 'empty').then(
        function() {
          assert.fail('Should not succeed.');
          done();
        },
        function(err) {
          assert.instanceOf(err, Error);
          done();
        }
      );
    }
  );

  it('overwrites existing files', function(done) {
    fs.rename('path/to/a.bin', 'nested/dir/file.txt', function(err) {
      assert.isTrue(!err);
      assert.isFalse(fs.existsSync('path/to/a.bin'));
      assert.isTrue(fs.existsSync('nested/dir/file.txt'));
      done();
    });
  });

  withPromise.it('promise overwrites existing files', function(done) {
    fs.promises.rename('path/to/a.bin', 'nested/dir/file.txt').then(function() {
      assert.isFalse(fs.existsSync('path/to/a.bin'));
      assert.isTrue(fs.existsSync('nested/dir/file.txt'));
      done();
    }, done);
  });

  it('allows directories to be renamed', function(done) {
    fs.rename('path/to', 'path/foo', function(err) {
      assert.isTrue(!err);
      assert.isFalse(fs.existsSync('path/to'));
      assert.isTrue(fs.existsSync('path/foo'));
      assert.deepEqual(fs.readdirSync('path/foo'), ['a.bin']);
      done();
    });
  });

  withPromise.it('promise allows directories to be renamed', function(done) {
    fs.promises.rename('path/to', 'path/foo').then(function() {
      assert.isFalse(fs.existsSync('path/to'));
      assert.isTrue(fs.existsSync('path/foo'));
      assert.deepEqual(fs.readdirSync('path/foo'), ['a.bin']);
      done();
    }, done);
  });

  it('calls callback with error if new directory not empty', function(done) {
    fs.rename('path', 'nested', function(err) {
      assert.instanceOf(err, Error);
      done();
    });
  });

  withPromise.it(
    'promise calls callback with error if new directory not empty',
    function(done) {
      fs.promises.rename('path', 'nested').then(
        function() {
          assert.fail('Should not succeed.');
          done();
        },
        function(err) {
          assert.instanceOf(err, Error);
          done();
        }
      );
    }
  );
});

describe('fs.renameSync(oldPath, newPath)', function() {
  beforeEach(function() {
    mock({
      'path/to/a.bin': bufferFrom([1, 2, 3]),
      empty: {},
      nested: {
        dir: {
          'file.txt': ''
        }
      },
      link: mock.symlink({path: './path/to/a.bin'})
    });
  });
  afterEach(mock.restore);

  it('allows files to be renamed', function() {
    fs.renameSync('path/to/a.bin', 'path/to/b.bin');
    assert.isFalse(fs.existsSync('path/to/a.bin'));
    assert.isTrue(fs.existsSync('path/to/b.bin'));
  });

  it('overwrites existing files', function() {
    fs.renameSync('path/to/a.bin', 'nested/dir/file.txt');
    assert.isFalse(fs.existsSync('path/to/a.bin'));
    assert.isTrue(fs.existsSync('nested/dir/file.txt'));
  });

  it('allows directories to be renamed', function() {
    fs.renameSync('path/to', 'path/foo');
    assert.isFalse(fs.existsSync('path/to'));
    assert.isTrue(fs.existsSync('path/foo'));
    assert.deepEqual(fs.readdirSync('path/foo'), ['a.bin']);
  });

  it('replaces existing directories (if empty)', function() {
    fs.renameSync('path/to', 'empty');
    assert.isFalse(fs.existsSync('path/to'));
    assert.isTrue(fs.existsSync('empty'));
    assert.deepEqual(fs.readdirSync('empty'), ['a.bin']);
  });

  it('renames symbolic links', function() {
    fs.renameSync('link', 'renamed');
    assert.isTrue(fs.existsSync('renamed'));
    assert.isFalse(fs.existsSync('link'));
    assert.isTrue(fs.existsSync('path/to/a.bin'));
  });

  it('throws if old path does not exist', function() {
    assert.throws(function() {
      fs.renameSync('bogus', 'empty');
    });
  });

  it('throws if new path basename is not directory', function() {
    assert.throws(function() {
      fs.renameSync('path/to/a.bin', 'bogus/a.bin');
    });
  });

  it('throws if new dir is not empty dir', function() {
    assert.throws(function() {
      fs.renameSync('path/to', 'nested');
    });
  });
});
