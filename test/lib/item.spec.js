var path = require('path');

var Item = require('../../lib/item');
var assert = require('../helper').assert;

describe('Item', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var item = new Item();
      assert.instanceOf(item, Item);
    });

  });

  describe('#getATime()', function() {

    it('returns a date', function() {
      var item = new Item();
      var date = item.getATime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });

  });

  describe('#setATime()', function() {

    it('sets the atime', function() {
      var item = new Item();
      var date = new Date();
      item.setATime(date);
      assert.equal(item.getATime(), date);
    });

  });

  describe('#getCTime()', function() {

    it('returns a date', function() {
      var item = new Item();
      var date = item.getCTime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });

  });

  describe('#setCTime()', function() {

    it('sets the ctime', function() {
      var item = new Item();
      var date = new Date();
      item.setCTime(date);
      assert.equal(item.getCTime(), date);
    });

  });

  describe('#getMTime()', function() {

    it('returns a date', function() {
      var item = new Item();
      var date = item.getMTime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });

  });

  describe('#setMTime()', function() {

    it('sets the mtime', function() {
      var item = new Item();
      var date = new Date();
      item.setMTime(date);
      assert.equal(item.getMTime(), date);
    });

  });

  describe('#getMode()', function() {

    it('returns a number', function() {
      var item = new Item();
      assert.isNumber(item.getMode());
    });

  });

  describe('#setMode()', function() {

    it('sets the mode', function() {
      var item = new Item();
      item.setMode(0644);
      assert.equal(item.getMode(), 0644);
    });

    it('updates the ctime', function() {
      var item = new Item();
      var original = new Date(1);
      item.setCTime(original);
      item.setMode(0644);
      assert.isTrue(item.getCTime() > original);
    });

  });

  describe('#setUid()', function() {

    it('sets the uid', function() {
      var item = new Item();
      item.setUid(42);
      assert.equal(item.getUid(), 42);
    });

    it('updates the ctime', function() {
      var item = new Item();
      var original = new Date(1);
      item.setCTime(original);
      item.setUid(42);
      assert.isTrue(item.getCTime() > original);
    });

  });

  describe('#setGid()', function() {

    it('sets the gid', function() {
      var item = new Item();
      item.setGid(42);
      assert.equal(item.getGid(), 42);
    });

    it('updates the ctime', function() {
      var item = new Item();
      var original = new Date(1);
      item.setCTime(original);
      item.setGid(42);
      assert.isTrue(item.getCTime() > original);
    });

  });

});
