'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;

describe('fs.createReadStream(path, [options])', function() {
  beforeEach(function() {
    mock({
      'dir/source': 'source content'
    });
  });
  afterEach(mock.restore);

  it('creates a readable stream', function() {
    const stream = fs.createReadStream('dir/source');
    assert.isTrue(stream.readable);
  });

  it('allows piping to a writable stream', function(done) {
    const input = fs.createReadStream('dir/source');
    const output = fs.createWriteStream('dir/dest');
    output.on('close', function() {
      fs.readFile('dir/dest', function(err, data) {
        if (err) {
          return done(err);
        }
        assert.equal(String(data), 'source content');
        done();
      });
    });
    output.on('error', done);

    input.pipe(output);
  });
});
