var path = require('path');

var FileDescriptor = require('../../lib/descriptor').FileDescriptor;
var helper = require('../helper');

var assert = helper.assert;
var flags = helper.flags;


describe('FileDescriptor', function() {

  describe('constructor', function() {

    it('creates a new descriptor', function() {
      var fd = new FileDescriptor('foo', flags('r'));
      assert.instanceOf(fd, FileDescriptor);
    });

  });

  describe('#getPath()', function() {

    it('returns the supplied path', function() {
      var fd = new FileDescriptor('foo/bar', flags('r'));
      assert.equal(fd.getPath(), 'foo/bar');
    });

  });

  describe('#isAppend()', function() {

    it('not opened for appending (r)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (r+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r+'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (rs)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (rs+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs+'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (w)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (wx)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (w+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w+'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (wx+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx+'));
      assert.isFalse(fd.isAppend());
    });

    it('opened for appending (a)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a'));
      assert.isTrue(fd.isAppend());
    });

    it('opened for appending (ax)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax'));
      assert.isTrue(fd.isAppend());
    });

    it('opened for appending (a+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a+'));
      assert.isTrue(fd.isAppend());
    });

    it('opened for appending (ax+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax+'));
      assert.isTrue(fd.isAppend());
    });

  });

  describe('#isCreate()', function() {

    it('not opened for creation (r)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r'));
      assert.isFalse(fd.isCreate());
    });

    it('not opened for creation (r+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r+'));
      assert.isFalse(fd.isCreate());
    });

    it('not opened for creation (rs)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs'));
      assert.isFalse(fd.isCreate());
    });

    it('not opened for creation (rs+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs+'));
      assert.isFalse(fd.isCreate());
    });

    it('opened for creation (w)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (wx)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (w+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (wx+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (a)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (ax)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (a+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (ax+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax+'));
      assert.isTrue(fd.isCreate());
    });

  });

  describe('#isRead()', function() {

    it('opened for reading (r)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (r+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (rs)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (rs+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs+'));
      assert.isTrue(fd.isRead());
    });

    it('not opened for reading (w)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w'));
      assert.isFalse(fd.isRead());
    });

    it('not opened for reading (wx)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx'));
      assert.isFalse(fd.isRead());
    });

    it('opened for reading (w+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (wx+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx+'));
      assert.isTrue(fd.isRead());
    });

    it('not opened for reading (a)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a'));
      assert.isFalse(fd.isRead());
    });

    it('not opened for reading (ax)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax'));
      assert.isFalse(fd.isRead());
    });

    it('opened for reading (a+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (ax+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax+'));
      assert.isTrue(fd.isRead());
    });

  });

  describe('#isWrite()', function() {

    it('not opened for writing (r)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r'));
      assert.isFalse(fd.isWrite());
    });

    it('opened for writing (r+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r+'));
      assert.isTrue(fd.isWrite());
    });

    it('not opened for writing (rs)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs'));
      assert.isFalse(fd.isWrite());
    });

    it('opened for writing (rs+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (w)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (wx)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (w+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (wx+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (a)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (ax)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (a+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (ax+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax+'));
      assert.isTrue(fd.isWrite());
    });

  });

  describe('#isExclusive()', function() {

    it('not opened exclusive (r)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (r+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('r+'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (rs)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (rs+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('rs+'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (w)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (wx)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened exclusive (w+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('w+'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (wx+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('wx+'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened exclusive (a)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (ax)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened exclusive (a+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('a+'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (ax+)', function() {
      var fd = new FileDescriptor('foo/bar', flags('ax+'));
      assert.isTrue(fd.isExclusive());
    });

  });

});
