'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;

describe('fs.readlink(path, callback)', function() {
  beforeEach(function() {
    mock({
      'file.txt': 'content',
      link: mock.symlink({path: './file.txt'})
    });
  });
  afterEach(mock.restore);

  it('reads a symbolic link', function(done) {
    fs.readlink('link', function(err, srcPath) {
      if (err) {
        return done(err);
      }
      assert.equal(srcPath, './file.txt');
      done();
    });
  });

  it('supports Buffer input', function(done) {
    fs.readlink(Buffer.from('link'), function(err, srcPath) {
      if (err) {
        return done(err);
      }
      assert.equal(srcPath, './file.txt');
      done();
    });
  });

  it('promise reads a symbolic link', function(done) {
    fs.promises.readlink('link').then(function(srcPath) {
      assert.equal(srcPath, './file.txt');
      done();
    }, done);
  });

  it('fails for regular files', function(done) {
    fs.readlink('file.txt', function(err, srcPath) {
      assert.instanceOf(err, Error);
      done();
    });
  });

  it('promise fails for regular files', function(done) {
    fs.promises.readlink('file.txt').then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        done();
      }
    );
  });
});

describe('fs.readlinkSync(path)', function() {
  beforeEach(function() {
    mock({
      'file.txt': 'content',
      link: mock.symlink({path: './file.txt'})
    });
  });
  afterEach(mock.restore);

  it('reads a symbolic link', function() {
    assert.equal(fs.readlinkSync('link'), './file.txt');
  });

  it('fails for regular files', function() {
    assert.throws(function() {
      fs.readlinkSync('file.txt');
    });
  });
});
