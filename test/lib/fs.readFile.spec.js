'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

describe('fs.readFile(filename, [options], callback)', function() {
  // this is provided by fs.open, fs.fstat, and fs.read
  // so more heavily tested elsewhere

  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content'
    });
  });
  afterEach(mock.restore);

  it('allows a file to be read asynchronously', function(done) {
    fs.readFile('path/to/file.txt', function(err, data) {
      if (err) {
        return done(err);
      }
      assert.isTrue(Buffer.isBuffer(data));
      assert.equal(String(data), 'file content');
      done();
    });
  });

  withPromise.it('promise allows a file to be read asynchronously', function(
    done
  ) {
    fs.promises.readFile('path/to/file.txt').then(function(data) {
      assert.isTrue(Buffer.isBuffer(data));
      assert.equal(String(data), 'file content');
      done();
    }, done);
  });

  it('fails for directory', function(done) {
    fs.readFile('path/to', function(err, data) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EBADF');
      done();
    });
  });

  withPromise.it('promise fails for directory', function(done) {
    fs.promises.readFile('path/to').then(
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

  it('fails for bad path', function(done) {
    fs.readFile('path/to/bogus', function(err, data) {
      assert.instanceOf(err, Error);
      // windows has different errno for ENOENT
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  withPromise.it('promise fails for bad path', function(done) {
    fs.promises.readFile('path/to/bogus').then(
      function() {
        assert.fail('should not succeed.');
        done();
      },
      function(err) {
        assert.instanceOf(err, Error);
        // windows has different errno for ENOENT
        assert.equal(err.code, 'ENOENT');
        done();
      }
    );
  });
});

describe('fs.readFileSync(filename, [options])', function() {
  // this is provided by fs.openSync, fs.fstatSync, and fs.readSync
  // so more heavily tested elsewhere

  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content'
    });
  });
  afterEach(mock.restore);

  it('allows a file to be read synchronously', function() {
    const data = fs.readFileSync('path/to/file.txt');
    assert.isTrue(Buffer.isBuffer(data));
    assert.equal(String(data), 'file content');
  });

  it('fails for directory', function() {
    assert.throws(function() {
      fs.readFileSync('path/to');
    });
  });

  it('fails for bad path', function() {
    assert.throws(function() {
      fs.readFileSync('path/to/bogus');
    });
  });
});
