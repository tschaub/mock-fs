const {describe, it} = require('mocha');
const Directory = require('../../lib/directory.js');
const File = require('../../lib/file.js');
const Item = require('../../lib/item.js');
const assert = require('../helper.js').assert;

describe('Directory', function () {
  describe('constructor', function () {
    it('creates a named directory', function () {
      const dir = new Directory();
      assert.instanceOf(dir, Directory);
      assert.instanceOf(dir, Item);
    });
  });

  describe('#addItem()', function () {
    it('allows a directory to be added', function () {
      const parent = new Directory();
      const child = new Directory();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('allows a file to be added', function () {
      const parent = new Directory();
      const child = new File();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('returns the added item', function () {
      const parent = new Directory();
      const child = new File();
      const got = parent.addItem('child', child);
      assert.equal(got, child);
    });
  });

  describe('#getItem()', function () {
    it('retrieves a named directory', function () {
      const parent = new Directory();
      const child = new Directory();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('retrieves a named file', function () {
      const parent = new Directory();
      const child = new File();
      parent.addItem('child', child);
      assert.equal(parent.getItem('child'), child);
    });

    it('returns null for missing item', function () {
      const parent = new Directory();
      const child = new File();
      parent.addItem('child', child);
      assert.isNull(parent.getItem('kid'));
    });
  });

  describe('#removeItem()', function () {
    it('allows a directory to be removed', function () {
      const parent = new Directory();
      const child = new Directory();
      parent.addItem('child', child);
      const removed = parent.removeItem('child');
      assert.equal(removed, child);
      assert.isNull(parent.getItem('child'));
    });

    it('allows a file to be removed', function () {
      const parent = new Directory();
      const child = new File();
      parent.addItem('child', child);
      const removed = parent.removeItem('child');
      assert.equal(removed, child);
      assert.isNull(parent.getItem('child'));
    });

    it('throws if item is not a child', function () {
      const parent = new Directory();
      parent.addItem('one', new Directory());
      parent.addItem('two', new File());
      assert.throws(function () {
        parent.removeItem('three');
      });
    });
  });

  describe('#list()', function () {
    it('lists all items in a directory', function () {
      const dir = new Directory();
      dir.addItem('one file', new File());
      dir.addItem('another file', new File());
      dir.addItem('a directory', new Directory());
      dir.addItem('another directory', new Directory());
      const list = dir.list();
      assert.deepEqual(list.sort(), [
        'a directory',
        'another directory',
        'another file',
        'one file',
      ]);
    });

    it('works for empty dir', function () {
      const dir = new Directory();
      assert.deepEqual(dir.list(), []);
    });

    it('lists one level deep', function () {
      const d0 = new Directory();
      const d1 = new Directory();
      const d2 = new Directory();
      d1.addItem('d2', d2);
      d0.addItem('d1', d1);
      assert.deepEqual(d0.list(), ['d1']);
    });
  });
});
