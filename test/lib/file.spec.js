'use strict';

const Item = require('../../lib/item');
const File = require('../../lib/file');
const assert = require('../helper').assert;
const bufferFrom = require('../../lib/buffer').from;

describe('File', function() {
  describe('constructor', function() {
    it('creates a named file', function() {
      const file = new File();
      assert.instanceOf(file, File);
      assert.instanceOf(file, Item);
    });
  });

  describe('#getContent()', function() {
    it('gets the file content', function() {
      const file = new File();
      const content = bufferFrom('bar');
      file.setContent(content);
      assert.equal(file.getContent(), content);
    });

    it('is initially empty', function() {
      const file = new File();
      assert.equal(String(file.getContent()), '');
    });

    it('updates the atime', function() {
      const file = new File();
      file.setContent('bar');
      const old = new Date(1);
      file.setATime(old);
      file.getContent();
      assert.isTrue(file.getATime() > old);
    });
  });

  describe('#setContent()', function() {
    it('accepts a string', function() {
      const file = new File();
      file.setContent('bar');
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'bar');
    });

    it('accepts a buffer', function() {
      const file = new File();
      file.setContent(bufferFrom('baz'));
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'baz');
    });

    it('throws for other types', function() {
      assert.throws(function() {
        const file = new File();
        file.setContent(123);
      });
    });

    it('updates the ctime and mtime', function() {
      const file = new File();
      const old = new Date(1);
      file.setCTime(old);
      file.setMTime(old);
      file.setContent('bar');
      assert.isTrue(file.getCTime() > old);
      assert.isTrue(file.getMTime() > old);
    });
  });
});
