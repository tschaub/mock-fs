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

  describe('#getATime()', function() {

    it('returns a date', function() {
      var item = new Item('foo');
      var date = item.getATime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });

  });

  describe('#setATime()', function() {

    it('sets the atime', function() {
      var item = new Item('foo');
      var date = new Date();
      item.setATime(date);
      assert.equal(item.getATime(), date);
    });

  });

  describe('#getCTime()', function() {

    it('returns a date', function() {
      var item = new Item('foo');
      var date = item.getCTime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });

  });

  describe('#setCTime()', function() {

    it('sets the ctime', function() {
      var item = new Item('foo');
      var date = new Date();
      item.setCTime(date);
      assert.equal(item.getCTime(), date);
    });

  });

  describe('#getMTime()', function() {

    it('returns a date', function() {
      var item = new Item('foo');
      var date = item.getMTime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });

  });

  describe('#setMTime()', function() {

    it('sets the mtime', function() {
      var item = new Item('foo');
      var date = new Date();
      item.setMTime(date);
      assert.equal(item.getMTime(), date);
    });

  });

  describe('#getMode()', function() {

    it('returns a number', function() {
      var item = new Item('foo');
      assert.isNumber(item.getMode());
    });

  });

  describe('#setMode()', function() {

    it('sets the mode', function() {
      var item = new Item('foo');
      item.setMode(0644);
      assert.equal(item.getMode(), 0644);
    });

  });

  describe('#getUid()', function() {

    it('returns undefined by default', function() {
      var item = new Item('foo');
      assert.isUndefined(item.getUid());
    });

  });

  describe('#setUid()', function() {

    it('sets the uid', function() {
      var item = new Item('foo');
      item.setUid(42);
      assert.equal(item.getUid(), 42);
    });

    it('updates the ctime', function() {
      var item = new Item('foo');
      var original = new Date(1);
      item.setCTime(original);
      item.setUid(42);
      assert.isTrue(item.getCTime() > original);
    });

  });

  describe('#getGid()', function() {

    it('returns undefined by default', function() {
      var item = new Item('foo');
      assert.isUndefined(item.getGid());
    });

  });

  describe('#setGid()', function() {

    it('sets the gid', function() {
      var item = new Item('foo');
      item.setGid(42);
      assert.equal(item.getGid(), 42);
    });

    it('updates the ctime', function() {
      var item = new Item('foo');
      var original = new Date(1);
      item.setCTime(original);
      item.setGid(42);
      assert.isTrue(item.getCTime() > original);
    });

  });

});
