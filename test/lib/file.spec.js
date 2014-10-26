'use strict';

var Item = require('../../lib/item');
var File = require('../../lib/file');
var assert = require('../helper').assert;

describe('File', function() {

  describe('constructor', function() {

    it('creates a named file', function() {
      var file = new File();
      assert.instanceOf(file, File);
      assert.instanceOf(file, Item);
    });

  });

  describe('#getContent()', function() {

    it('gets the file content', function() {
      var file = new File();
      var content = new Buffer('bar');
      file.setContent(content);
      assert.equal(file.getContent(), content);
    });

    it('is initially empty', function() {
      var file = new File();
      assert.equal(String(file.getContent()), '');
    });

    it('updates the atime', function() {
      var file = new File();
      file.setContent('bar');
      var old = new Date(1);
      file.setATime(old);
      file.getContent();
      assert.isTrue(file.getATime() > old);
    });

  });

  describe('#setContent()', function() {

    it('accepts a string', function() {
      var file = new File();
      file.setContent('bar');
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'bar');
    });

    it('accepts a buffer', function() {
      var file = new File();
      file.setContent(new Buffer('baz'));
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'baz');
    });

    it('throws for other types', function() {
      assert.throws(function() {
        var file = new File();
        file.setContent(123);
      });
    });

    it('updates the ctime and mtime', function() {
      var file = new File();
      var old = new Date(1);
      file.setCTime(old);
      file.setMTime(old);
      file.setContent('bar');
      assert.isTrue(file.getCTime() > old);
      assert.isTrue(file.getMTime() > old);
    });

  });

});
