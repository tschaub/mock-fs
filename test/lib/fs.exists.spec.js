'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const path = require('path');
const bufferFrom = require('../../lib/buffer').from;

const assert = helper.assert;

describe('fs.exists(path, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/a.bin': bufferFrom([1, 2, 3]),
      empty: {},
      nested: {
        dir: {
          'file.txt': ''
        }
      }
    });
  });
  afterEach(mock.restore);

  it('calls with true if file exists', function(done) {
    fs.exists(path.join('path', 'to', 'a.bin'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if directory exists', function(done) {
    fs.exists('path', function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if empty directory exists', function(done) {
    fs.exists('empty', function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if nested directory exists', function(done) {
    fs.exists(path.join('nested', 'dir'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if file exists', function(done) {
    fs.exists(path.join('path', 'to', 'a.bin'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with true if empty file exists', function(done) {
    fs.exists(path.join('nested', 'dir', 'file.txt'), function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it('calls with false for bogus path', function(done) {
    fs.exists(path.join('bogus', 'path'), function(exists) {
      assert.isFalse(exists);
      done();
    });
  });

  it('calls with false for bogus path (II)', function(done) {
    fs.exists(path.join('nested', 'dir', 'none'), function(exists) {
      assert.isFalse(exists);
      done();
    });
  });
});

describe('fs.existsSync(path)', function() {
  beforeEach(function() {
    mock({
      'path/to/a.bin': bufferFrom([1, 2, 3]),
      empty: {},
      nested: {
        dir: {
          'file.txt': ''
        }
      }
    });
  });
  afterEach(mock.restore);

  it('returns true if file exists', function() {
    assert.isTrue(fs.existsSync(path.join('path', 'to', 'a.bin')));
  });

  it('returns true if directory exists', function() {
    assert.isTrue(fs.existsSync('path'));
  });

  it('returns true if empty directory exists', function() {
    assert.isTrue(fs.existsSync('empty'));
  });

  it('returns true if nested directory exists', function() {
    assert.isTrue(fs.existsSync(path.join('nested', 'dir')));
  });

  it('returns true if file exists', function() {
    assert.isTrue(fs.existsSync(path.join('path', 'to', 'a.bin')));
  });

  it('returns true if empty file exists', function() {
    assert.isTrue(fs.existsSync(path.join('nested', 'dir', 'file.txt')));
  });

  it('returns false for bogus path', function() {
    assert.isFalse(fs.existsSync(path.join('bogus', 'path')));
  });

  it('returns false for bogus path (II)', function() {
    assert.isFalse(fs.existsSync(path.join('nested', 'dir', 'none')));
  });
});
