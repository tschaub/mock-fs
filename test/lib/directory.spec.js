var Item = require('../../lib/item').Item;
var Directory = require('../../lib/directory').Directory;
var File = require('../../lib/file').File;
var assert = require('../helper').assert;

describe('Directory', function() {

  describe('constructor', function() {

    it('creates a named directory', function() {
      var dir = new Directory('foo');
      assert.instanceOf(dir, Directory);
      assert.instanceOf(dir, Item);
    });

  });

  describe('#getName()', function() {

    it('gets the directory name', function() {
      var dir = new Directory('foo');
      assert.equal(dir.getName(), 'foo');
    });

  });

  describe('#addItem()', function() {

    it('allows a directory to be added', function() {
      var parent = new Directory('parent');
      var child = new Directory('child');
      parent.addItem(child);
      assert.equal(child.getParent(), parent);
    });

    it('allows a file to be added', function() {
      var parent = new Directory('parent');
      var child = new File('child');
      parent.addItem(child);
      assert.equal(child.getParent(), parent);
    });

    it('returns the added item', function() {
      var parent = new Directory('parent');
      var child = new File('child');
      var got = parent.addItem(child);
      assert.equal(got, child);
    });

  });

  describe('#getItem()', function() {

    it('retrieves a named directory', function() {
      var parent = new Directory('parent');
      var child = new Directory('child');
      parent.addItem(child);
      assert.equal(parent.getItem('child'), child);
    });

    it('retrieves a named file', function() {
      var parent = new Directory('parent');
      var child = new File('child');
      parent.addItem(child);
      assert.equal(parent.getItem('child'), child);
    });

    it('returns null for missing item', function() {
      var parent = new Directory('parent');
      var child = new File('child');
      parent.addItem(child);
      assert.isNull(parent.getItem('kid'));
    });

  });

  describe('#removeItem()', function() {

    it('allows a directory to be removed', function() {
      var parent = new Directory('parent');
      var child = new Directory('child');
      parent.addItem(child);
      var removed = parent.removeItem(child);
      assert.equal(removed, child);
      assert.isNull(removed.getParent());
    });

    it('allows a file to be removed', function() {
      var parent = new Directory('parent');
      var child = new File('child');
      parent.addItem(child);
      var removed = parent.removeItem(child);
      assert.equal(removed, child);
      assert.isNull(removed.getParent());
    });

    it('throws if item is not a child', function() {
      var parent = new Directory('parent');
      parent.addItem(new Directory('one'));
      parent.addItem(new File('two'));
      assert.throws(function() {
        parent.removeItem(new File('two'));
      });
    });

  });

  describe('#renameItem()', function() {

    it('renames a child directory', function() {
      var parent = new Directory('parent');
      var child = new Directory('child');
      parent.addItem(child);
      parent.renameItem('child', 'kid');
      assert.equal(child.getName(), 'kid');
      assert.equal(child.getParent(), parent);
    });

    it('renames a child file', function() {
      var parent = new Directory('parent');
      var child = new File('child');
      parent.addItem(child);
      parent.renameItem('child', 'kid');
      assert.equal(child.getName(), 'kid');
      assert.equal(child.getParent(), parent);
    });

    it('throws on name conflict', function() {
      var parent = new Directory('parent');
      parent.addItem(new File('one'));
      parent.addItem(new File('two'));
      assert.throws(function() {
        parent.renameItem('one', 'two');
      });
    });

    it('throws if no child exists', function() {
      var parent = new Directory('parent');
      assert.throws(function() {
        parent.renameItem('foo', 'bar');
      });
    });

  });

  describe('#list()', function() {

    it('lists all items in a directory', function() {
      var dir = new Directory('root');
      dir.addItem(new File('one file'));
      dir.addItem(new File('another file'));
      dir.addItem(new Directory('a directory'));
      dir.addItem(new Directory('another directory'));
      var list = dir.list();
      assert.deepEqual(list.sort(), [
        'a directory',
        'another directory',
        'another file',
        'one file'
      ]);
    });

    it('works for empty dir', function() {
      var dir = new Directory('empty');
      assert.deepEqual(dir.list(), []);
    });

    it('lists one level deep', function() {
      var d0 = new Directory('d0');
      var d1 = new Directory('d1');
      var d2 = new Directory('d2');
      d1.addItem(d2);
      d0.addItem(d1);
      assert.deepEqual(d0.list(), ['d1']);
    });

  });

});
