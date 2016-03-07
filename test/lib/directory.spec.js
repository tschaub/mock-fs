'use strict';

var Item = require('../../lib/item');
var Directory = require('../../lib/directory');
var File = require('../../lib/file');
var assert = require('../helper').assert;

describe('Directory', function() {

  describe('constructor', function() {

    it('creates a named directory', function() {
      var dir = new Directory();
      assert.instanceOf(dir, Directory);
      assert.instanceOf(dir, Item);
    });

  });

  describe('#addItem()', function() {

    it('allows a directory to be added', function() {
      var parent = new Directory();
      var child = new Directory();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('allows a file to be added', function() {
      var parent = new Directory();
      var child = new File();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('returns the added item', function() {
      var parent = new Directory();
      var child = new File();
      var got = parent.addItem('child', child);
      assert.equal(got, child);
    });

  });

  describe('#getItem()', function() {

    it('retrieves a named directory', function() {
      var parent = new Directory();
      var child = new Directory();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('retrieves a named file', function() {
      var parent = new Directory();
      var child = new File();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('returns null for missing item', function() {
      var parent = new Directory();
      var child = new File();
      parent.addItem('child', child);
      assert.isNull(parent.getItem('kid'));
    });

  });

  describe('#removeItem()', function() {

    it('allows a directory to be removed', function() {
      var parent = new Directory();
      var child = new Directory();
      parent.addItem('child', child);
      var removed = parent.removeItem('child');
      assert.equal(removed, child);
      assert.isNull(parent.getItem('child'));
    });

    it('allows a file to be removed', function() {
      var parent = new Directory();
      var child = new File();
      parent.addItem('child', child);
      var removed = parent.removeItem('child');
      assert.equal(removed, child);
      assert.isNull(parent.getItem('child'));
    });

    it('throws if item is not a child', function() {
      var parent = new Directory();
      parent.addItem('one', new Directory());
      parent.addItem('two', new File());
      assert.throws(function() {
        parent.removeItem('three');
      });
    });

  });

  describe('#list()', function() {

    it('lists all items in a directory', function() {
      var dir = new Directory();
      dir.addItem('one file', new File());
      dir.addItem('another file', new File());
      dir.addItem('a directory', new Directory());
      dir.addItem('another directory', new Directory());
      var list = dir.list();
      assert.deepEqual(list.sort(), [
        'a directory',
        'another directory',
        'another file',
        'one file'
      ]);
    });

    it('works for empty dir', function() {
      var dir = new Directory();
      assert.deepEqual(dir.list(), []);
    });

    it('lists one level deep', function() {
      var d0 = new Directory();
      var d1 = new Directory();
      var d2 = new Directory();
      d1.addItem('d2', d2);
      d0.addItem('d1', d1);
      assert.deepEqual(d0.list(), ['d1']);
    });

  });

});
