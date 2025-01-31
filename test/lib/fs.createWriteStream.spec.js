const fs = require('fs');
const Writable = require('stream').Writable;
const {afterEach, beforeEach, describe, it} = require('mocha');
const mock = require('../../lib/index.js');
const helper = require('../helper.js');

const assert = helper.assert;

describe('fs.createWriteStream(path[, options])', function () {
  beforeEach(function () {
    mock();
  });
  afterEach(mock.restore);

  it('provides a write stream for a file in buffered mode', function (done) {
    const output = fs.createWriteStream('test.txt');
    output.on('close', function () {
      fs.readFile('test.txt', function (err, data) {
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
    output.write(Buffer.from('lots '));
    output.write(Buffer.from('of '));
    output.write(Buffer.from('source '));
    output.end(Buffer.from('content'));
  });

  it('provides a write stream for a file', function (done) {
    const output = fs.createWriteStream('test.txt');
    output.on('close', function () {
      fs.readFile('test.txt', function (err, data) {
        if (err) {
          return done(err);
        }
        assert.equal(String(data), 'lots of source content');
        done();
      });
    });
    output.on('error', done);

    output.write(Buffer.from('lots '));
    setTimeout(function () {
      output.write(Buffer.from('of '));
      setTimeout(function () {
        output.write(Buffer.from('source '));
        setTimeout(function () {
          output.end(Buffer.from('content'));
        }, 50);
      }, 50);
    }, 50);
  });

  if (Writable && Writable.prototype.cork) {
    it('works when write stream is corked', function (done) {
      const output = fs.createWriteStream('test.txt');
      output.on('close', function () {
        fs.readFile('test.txt', function (err, data) {
          if (err) {
            return done(err);
          }
          assert.equal(String(data), 'lots of source content');
          done();
        });
      });
      output.on('error', done);

      output.cork();
      output.write(Buffer.from('lots '));
      output.write(Buffer.from('of '));
      output.write(Buffer.from('source '));
      output.end(Buffer.from('content'));
      output.uncork();
    });
  }
});
