const fs = require('fs');
const {afterEach, beforeEach, describe, it} = require('mocha');
const mock = require('../../lib/index.js');
const helper = require('../helper.js');

const assert = helper.assert;

describe('fs.writeFile(filename, data, [options], callback)', function () {
  beforeEach(function () {
    mock({
      dir: mock.directory({
        mtime: new Date(1),
      }),
    });
  });
  afterEach(mock.restore);

  it('writes a string to a file', function (done) {
    fs.writeFile('dir/foo', 'bar', function (err) {
      if (err) {
        return done(err);
      }
      assert.equal(String(fs.readFileSync('dir/foo')), 'bar');
      done();
    });
  });

  it('promise writes a string to a file', function (done) {
    fs.promises
      .writeFile('dir/foo', 'bar')
      .then(function () {
        assert.equal(String(fs.readFileSync('dir/foo')), 'bar');
        done();
      })
      .catch(done);
  });

  it('updates mtime of parent directory', function (done) {
    const oldTime = fs.statSync('dir').mtime;
    fs.writeFile('dir/foo', 'bar', function (err) {
      if (err) {
        return done(err);
      }
      const newTime = fs.statSync('dir').mtime;
      assert.isTrue(newTime > oldTime);
      done();
    });
  });

  it('promise updates mtime of parent directory', function (done) {
    const oldTime = fs.statSync('dir').mtime;
    fs.promises
      .writeFile('dir/foo', 'bar')
      .then(function () {
        const newTime = fs.statSync('dir').mtime;
        assert.isTrue(newTime > oldTime);
        done();
      })
      .catch(done);
  });

  it('writes a buffer to a file', function (done) {
    fs.writeFile('dir/foo', Buffer.from('bar'), function (err) {
      if (err) {
        return done(err);
      }
      assert.equal(String(fs.readFileSync('dir/foo')), 'bar');
      done();
    });
  });

  it('promise writes a buffer to a file', function (done) {
    fs.promises
      .writeFile('dir/foo', Buffer.from('bar'))
      .then(function () {
        assert.equal(String(fs.readFileSync('dir/foo')), 'bar');
        done();
      })
      .catch(done);
  });

  it('fails if directory does not exist', function (done) {
    fs.writeFile('foo/bar', 'baz', function (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('promise fails if directory does not exist', function (done) {
    fs.promises.writeFile('foo/bar', 'baz').then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      },
    );
  });
});

describe('fs.writeFileSync(filename, data, [options]', function () {
  beforeEach(function () {
    mock({
      '.': {},
    });
  });
  afterEach(mock.restore);

  it('writes a string to a file', function () {
    fs.writeFileSync('foo', 'bar');
    assert.equal(String(fs.readFileSync('foo')), 'bar');
  });

  it('writes a buffer to a file', function () {
    fs.writeFileSync('foo', Buffer.from('bar'));
    assert.equal(String(fs.readFileSync('foo')), 'bar');
  });

  it('fails if directory does not exist', function () {
    assert.throws(function () {
      fs.writeFileSync('foo/bar', 'baz');
    });
  });
});
