'use strict';

const Writable = require('stream').Writable;
const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const bufferFrom = require('../../lib/buffer').from;

const assert = helper.assert;

describe('fs.createWriteStream(path[, options])', function() {
  beforeEach(function() {
    mock();
  });
  afterEach(mock.restore);

  it('provides a write stream for a file in buffered mode', function(done) {
    const output = fs.createWriteStream('test.txt');
    output.on('close', function() {
      fs.readFile('test.txt', function(err, data) {
        if (err) {
          return done(err);
        }
        assert.equal(String(data), 'lots of source content');
        done();
      });
    });
    output.on('error', done);

    // if output._writev is available, buffered multiple writes will hit _writev.
    // otherwise, hit multiple _write.
    output.write(bufferFrom('lots '));
    output.write(bufferFrom('of '));
    output.write(bufferFrom('source '));
    output.end(bufferFrom('content'));
  });

  it('provides a write stream for a file', function(done) {
    const output = fs.createWriteStream('test.txt');
    output.on('close', function() {
      fs.readFile('test.txt', function(err, data) {
        if (err) {
          return done(err);
        }
        assert.equal(String(data), 'lots of source content');
        done();
      });
    });
    output.on('error', done);

    output.write(bufferFrom('lots '));
    setTimeout(function() {
      output.write(bufferFrom('of '));
      setTimeout(function() {
        output.write(bufferFrom('source '));
        setTimeout(function() {
          output.end(bufferFrom('content'));
        }, 50);
      }, 50);
    }, 50);
  });

  if (Writable && Writable.prototype.cork) {
    it('works when write stream is corked', function(done) {
      const output = fs.createWriteStream('test.txt');
      output.on('close', function() {
        fs.readFile('test.txt', function(err, data) {
          if (err) {
            return done(err);
          }
          assert.equal(String(data), 'lots of source content');
          done();
        });
      });
      output.on('error', done);

      output.cork();
      output.write(bufferFrom('lots '));
      output.write(bufferFrom('of '));
      output.write(bufferFrom('source '));
      output.end(bufferFrom('content'));
      output.uncork();
    });
  }
});
