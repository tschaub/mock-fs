'use strict';

const helper = require('../helper.js');
const fs = require('fs');
const mock = require('../../lib/index.js');

const assert = helper.assert;

describe('fs.chown(path, uid, gid, callback)', function () {
  beforeEach(function () {
    mock({
      'path/empty': {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('changes ownership of a file', function (done) {
    fs.chown('file.txt', 42, 43, done);
  });

  it('supports Buffer input', function (done) {
    fs.chown(Buffer.from('file.txt'), 42, 43, done);
  });

  it('promise changes ownership of a file', function (done) {
    fs.promises.chown('file.txt', 42, 43).then(done, done);
  });

  it('fails if file does not exist', function (done) {
    fs.chown('bogus.txt', 42, 43, function (err) {
      assert.instanceOf(err, Error);
      done();
    });
  });

  it('promise fails if file does not exist', function (done) {
    fs.promises.chown('bogus.txt', 42, 43).then(
      function () {
        done(new Error('should not succeed.'));
      },
      function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      }
    );
  });
});

describe('fs.chownSync(path, uid, gid)', function () {
  beforeEach(function () {
    mock({
      'path/empty': {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('changes ownership of a file', function () {
    fs.chownSync('file.txt', 42, 43);
  });

  it('fails if file does not exist', function () {
    assert.throws(function () {
      fs.chownSync('bogus.txt', 42, 43);
    });
  });
});

describe('fs.fchown(fd, uid, gid, callback)', function () {
  beforeEach(function () {
    mock({
      'path/empty': {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('changes ownership of a file', function (done) {
    const fd = fs.openSync('file.txt', 'r');
    fs.fchown(fd, 42, 43, done);
  });

  it('promise changes ownership of a file', function (done) {
    fs.promises
      .open('file.txt', 'r')
      .then(function (fd) {
        return fd.chown(42, 43);
      })
      .then(done, done);
  });
});

describe('fs.fchownSync(fd, uid, gid)', function () {
  beforeEach(function () {
    mock({
      'path/empty': {},
      'file.txt': 'content',
    });
  });
  afterEach(mock.restore);

  it('changes ownership of a file', function () {
    const fd = fs.openSync('file.txt', 'r');
    fs.fchownSync(fd, 42, 43);
  });
});
