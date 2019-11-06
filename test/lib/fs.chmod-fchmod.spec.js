'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.chmod(path, mode, callback)', function() {
  beforeEach(function() {
    mock({
      'file.txt': mock.file({mode: parseInt('0644', 8)})
    });
  });
  afterEach(mock.restore);

  it('changes permissions of a file', function(done) {
    fs.chmod('file.txt', parseInt('0664', 8), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.mode & parseInt('0777', 8), parseInt('0664', 8));
      done();
    });
  });

  withPromise.it('promise changes permissions of a file', function(done) {
    fs.promises.chmod('file.txt', parseInt('0664', 8)).then(function() {
      const stats = fs.statSync('file.txt');
      assert.equal(stats.mode & parseInt('0777', 8), parseInt('0664', 8));
      done();
    }, done);
  });

  it('fails if file does not exist', function(done) {
    fs.chmod('bogus.txt', parseInt('0664', 8), function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  withPromise.it('promise fails if file does not exist', function(done) {
    fs.promises.chmod('bogus.txt', parseInt('0664', 8)).then(
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
});

describe('fs.chmodSync(path, mode)', function() {
  beforeEach(function() {
    mock({
      'file.txt': mock.file({mode: parseInt('0666', 8)})
    });
  });
  afterEach(mock.restore);

  it('changes permissions of a file', function() {
    fs.chmodSync('file.txt', parseInt('0644', 8));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.mode & parseInt('0777', 8), parseInt('0644', 8));
  });

  it('fails if file does not exist', function() {
    assert.throws(function() {
      fs.chmodSync('bogus.txt', parseInt('0644', 8));
    });
  });
});

describe('fs.fchmod(fd, mode, callback)', function() {
  beforeEach(function() {
    mock({
      'file.txt': mock.file({mode: parseInt('0666', 8)})
    });
  });
  afterEach(mock.restore);

  it('changes permissions of a file', function(done) {
    const fd = fs.openSync('file.txt', 'r');
    fs.fchmod(fd, parseInt('0644', 8), function(err) {
      if (err) {
        return done(err);
      }
      const stats = fs.statSync('file.txt');
      assert.equal(stats.mode & parseInt('0777', 8), parseInt('0644', 8));
      done();
    });
  });

  withPromise.it('promise changes permissions of a file', function(done) {
    fs.promises
      .open('file.txt', 'r')
      .then(function(fd) {
        return fd.chmod(parseInt('0644', 8));
      })
      .then(function() {
        const stats = fs.statSync('file.txt');
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0644', 8));
        done();
      }, done);
  });
});

describe('fs.fchmodSync(fd, mode)', function() {
  beforeEach(function() {
    mock({
      'file.txt': 'content'
    });
  });
  afterEach(mock.restore);

  it('changes permissions of a file', function() {
    const fd = fs.openSync('file.txt', 'r');
    fs.fchmodSync(fd, parseInt('0444', 8));
    const stats = fs.statSync('file.txt');
    assert.equal(stats.mode & parseInt('0777', 8), parseInt('0444', 8));
  });
});
