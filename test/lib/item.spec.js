var path = require('path');

var Item = require('../../lib/item').Item;
var assert = require('../helper').assert;

describe('Item', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var item = new Item('foo');
      assert.instanceOf(item, Item);
    });

  });

  describe('#getName()', function() {

    it('gets the name passed to the constructor', function() {
      var item = new Item('foo');
      assert.equal(item.getName(), 'foo');
    });

  });

  describe('#setName()', function() {

    it('sets the name', function() {
      var item = new Item('foo');
      item.setName('bar');
      assert.equal(item.getName(), 'bar');
    });

  });

  describe('#getParent()', function() {

    it('returns null if no parent', function() {
      var item = new Item('foo');
      assert.isNull(item.getParent());
    });

  });

  describe('#setParent()', function() {

    it('sets the parent', function() {
      var parent = new Item('foo');
      var child = new Item('bar');
      child.setParent(parent);
      assert.equal(child.getParent(), parent);
    });

  });

  describe('#getPath()', function() {

    it('constructs a path', function() {
      var parent = new Item('foo');
      var child = new Item('bar');
      var grandchild = new Item('baz.js');
      child.setParent(parent);
      grandchild.setParent(child);
      assert.equal(grandchild.getPath(), path.join('foo', 'bar', 'baz.js'));
    });

  });

});
