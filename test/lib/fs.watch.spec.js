'use strict';

const EventEmitter = require('events');
const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const assertEvent = helper.assertEvent;

describe('fs.watch(filepath, options, listener)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content'
    });
  });

  afterEach(function() {
    mock.restore();
  });

  it('fails if the path does not exist', function() {
    assert.throws(function() {
      fs.watch('bogus.txt', {}, function() {});
    });
  });

  it('returns an instance of EventEmitter', function() {
    const watcher = fs.watch('path/to/file.txt');
    assert.instanceOf(watcher, EventEmitter);
  });

  it('emits a change event when the file is written', function() {
    const watcher = fs.watch('path/to/file.txt');
    assertEvent(
      function() {
        fs.writeFileSync('path/to/file.txt', 'new contents');
      },
      watcher,
      'change',
      'change',
      'path/to/file.txt'
    );
  });
});
