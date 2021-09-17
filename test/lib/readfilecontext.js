'use strict';

const constants = require('constants');
const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const {
  patchReadFileContext,
  getReadFileContextPrototype
} = require('../../lib/readfilecontext');

const assert = helper.assert;
const inVersion = helper.inVersion;

describe('getReadFileContextPrototype', function() {
  it('provides access to the internal ReadFileContext', function() {
    const proto = getReadFileContextPrototype();
    assert.equal(proto.constructor.name, 'ReadFileContext');
    assert.equal(typeof proto.read, 'function');
    assert.equal(typeof proto.close, 'function');
  });
});

describe('patchReadFileContext', function() {
  it('patch forwards calls to mocked binding when available', function() {
    const calls = {
      read: 0,
      close: 0,
      mockedRead: 0,
      mockedClose: 0
    };

    const proto = {
      read: function() {
        calls.read++;
      },
      close: function() {
        calls.close++;
      }
    };

    const mockedBinding = {
      read: function() {
        assert.strictEqual(this, mockedBinding);
        calls.mockedRead++;
      },
      close: function() {
        assert.strictEqual(this, mockedBinding);
        calls.mockedClose++;
      }
    };

    patchReadFileContext(proto);

    const target = Object.create(proto);

    assert.deepEqual(calls, {
      read: 0,
      close: 0,
      mockedRead: 0,
      mockedClose: 0
    });

    target.read();
    assert.deepEqual(calls, {
      read: 1,
      close: 0,
      mockedRead: 0,
      mockedClose: 0
    });
    target.close();
    assert.deepEqual(calls, {
      read: 1,
      close: 1,
      mockedRead: 0,
      mockedClose: 0
    });

    proto._mockedBinding = mockedBinding;
    target.read();
    assert.deepEqual(calls, {
      read: 1,
      close: 1,
      mockedRead: 1,
      mockedClose: 0
    });
    target.close();
    assert.deepEqual(calls, {
      read: 1,
      close: 1,
      mockedRead: 1,
      mockedClose: 1
    });

    delete proto._mockedBinding;
    target.read();
    assert.deepEqual(calls, {
      read: 2,
      close: 1,
      mockedRead: 1,
      mockedClose: 1
    });
    target.close();
    assert.deepEqual(calls, {
      read: 2,
      close: 2,
      mockedRead: 1,
      mockedClose: 1
    });
  });
});

describe('fs.readFile() with ReadFileContext', function() {
  // fs.readFile() is already tested elsewhere, here we just make sure we have
  // coverage of the mocked ReadFileContext implementation.

  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      1: 'fd content'
    });
  });
  afterEach(mock.restore);

  inVersion('>=15.0.0').it('allows file reads to be aborted', function(done) {
    const controller = new AbortController();
    const {signal} = controller;

    fs.readFile('path/to/file.txt', {signal}, function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.name, 'AbortError');
      assert.equal(err.code, 'ABORT_ERR');
      done();
    });

    // By aborting after the call it will be handled by the context rather than readFile()
    controller.abort();
  });

  it('allows file reads with a numeric descriptor', function(done) {
    // This isn't actually supported by mock-fs, but let's make sure the call goes through
    // It also covers the case of reading an empty file and reading with encoding
    fs.readFile(1, 'utf-8', function(err, data) {
      assert.isNull(err);
      assert.equal(data, '');
      done();
    });
  });

  it('allows file reads with unknown size', function(done) {
    mock({
      'unknown-size.txt': function() {
        const file = mock.file({
          content: Buffer.from('unknown size')
        })();

        // Override getStats to drop the S_IFREG flag
        const origGetStats = file.getStats;
        file.getStats = function() {
          const stats = origGetStats.apply(this, arguments);
          stats[1] ^= constants.S_IFREG;
          return stats;
        };
        return file;
      }
    });

    fs.readFile('unknown-size.txt', 'utf-8', function(err, data) {
      assert.isNull(err);
      assert.equal(data, 'unknown size');
      done();
    });
  });
});
