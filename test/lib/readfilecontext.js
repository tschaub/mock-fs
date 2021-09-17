'use strict';

const helper = require('../helper');
const {
  patchReadFileContext,
  getReadFileContextPrototype
} = require('../../lib/readfilecontext');

const assert = helper.assert;

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
