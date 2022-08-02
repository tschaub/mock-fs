'use strict';

const constants = require('constants');
const FileDescriptor = require('../../lib/descriptor.js');
const helper = require('../helper.js');

const assert = helper.assert;
const flags = helper.flags;

describe('FileDescriptor', function () {
  describe('constructor', function () {
    it('creates a new descriptor', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.instanceOf(fd, FileDescriptor);
    });
  });

  describe('#getPosition()', function () {
    it('returns zero by default', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.equal(fd.getPosition(), 0);
    });
  });

  describe('#setPosition()', function () {
    it('updates the position', function () {
      const fd = new FileDescriptor(flags('r'));
      fd.setPosition(10);
      assert.equal(fd.getPosition(), 10);
    });
  });

  describe('#isAppend()', function () {
    it('not opened for appending (r)', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (r+)', function () {
      const fd = new FileDescriptor(flags('r+'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (rs)', function () {
      const fd = new FileDescriptor(flags('rs'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (rs+)', function () {
      const fd = new FileDescriptor(flags('rs+'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (w)', function () {
      const fd = new FileDescriptor(flags('w'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (wx)', function () {
      const fd = new FileDescriptor(flags('wx'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (w+)', function () {
      const fd = new FileDescriptor(flags('w+'));
      assert.isFalse(fd.isAppend());
    });

    it('not opened for appending (wx+)', function () {
      const fd = new FileDescriptor(flags('wx+'));
      assert.isFalse(fd.isAppend());
    });

    it('opened for appending (a)', function () {
      const fd = new FileDescriptor(flags('a'));
      assert.isTrue(fd.isAppend());
    });

    it('opened for appending (ax)', function () {
      const fd = new FileDescriptor(flags('ax'));
      assert.isTrue(fd.isAppend());
    });

    it('opened for appending (a+)', function () {
      const fd = new FileDescriptor(flags('a+'));
      assert.isTrue(fd.isAppend());
    });

    it('opened for appending (ax+)', function () {
      const fd = new FileDescriptor(flags('ax+'));
      assert.isTrue(fd.isAppend());
    });

    it('not opened for appending (O_CREAT | O_RDONLY)', function () {
      const fd = new FileDescriptor(constants.O_CREAT | constants.O_RDONLY);
      assert.isFalse(fd.isAppend());
    });
  });

  describe('#isTruncate()', function () {
    it('not opened for truncating (r)', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (r+)', function () {
      const fd = new FileDescriptor(flags('r+'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (rs)', function () {
      const fd = new FileDescriptor(flags('rs'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (rs+)', function () {
      const fd = new FileDescriptor(flags('rs+'));
      assert.isFalse(fd.isTruncate());
    });

    it('opened for truncating (w)', function () {
      const fd = new FileDescriptor(flags('w'));
      assert.isTrue(fd.isTruncate());
    });

    it('opened for truncating (wx)', function () {
      const fd = new FileDescriptor(flags('wx'));
      assert.isTrue(fd.isTruncate());
    });

    it('opened for truncating (w+)', function () {
      const fd = new FileDescriptor(flags('w+'));
      assert.isTrue(fd.isTruncate());
    });

    it('opened for truncating (wx+)', function () {
      const fd = new FileDescriptor(flags('wx+'));
      assert.isTrue(fd.isTruncate());
    });

    it('not opened for truncating (a)', function () {
      const fd = new FileDescriptor(flags('a'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (ax)', function () {
      const fd = new FileDescriptor(flags('ax'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (a+)', function () {
      const fd = new FileDescriptor(flags('a+'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (ax+)', function () {
      const fd = new FileDescriptor(flags('ax+'));
      assert.isFalse(fd.isTruncate());
    });

    it('not opened for truncating (O_CREAT | O_RDONLY)', function () {
      const fd = new FileDescriptor(constants.O_CREAT | constants.O_RDONLY);
      assert.isFalse(fd.isTruncate());
    });
  });

  describe('#isCreate()', function () {
    it('not opened for creation (r)', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.isFalse(fd.isCreate());
    });

    it('not opened for creation (r+)', function () {
      const fd = new FileDescriptor(flags('r+'));
      assert.isFalse(fd.isCreate());
    });

    it('not opened for creation (rs)', function () {
      const fd = new FileDescriptor(flags('rs'));
      assert.isFalse(fd.isCreate());
    });

    it('not opened for creation (rs+)', function () {
      const fd = new FileDescriptor(flags('rs+'));
      assert.isFalse(fd.isCreate());
    });

    it('opened for creation (w)', function () {
      const fd = new FileDescriptor(flags('w'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (wx)', function () {
      const fd = new FileDescriptor(flags('wx'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (w+)', function () {
      const fd = new FileDescriptor(flags('w+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (wx+)', function () {
      const fd = new FileDescriptor(flags('wx+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (a)', function () {
      const fd = new FileDescriptor(flags('a'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (ax)', function () {
      const fd = new FileDescriptor(flags('ax'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (a+)', function () {
      const fd = new FileDescriptor(flags('a+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (ax+)', function () {
      const fd = new FileDescriptor(flags('ax+'));
      assert.isTrue(fd.isCreate());
    });

    it('opened for creation (O_CREAT | O_RDONLY)', function () {
      const fd = new FileDescriptor(constants.O_CREAT | constants.O_RDONLY);
      assert.isTrue(fd.isCreate());
    });
  });

  describe('#isRead()', function () {
    it('opened for reading (r)', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (r+)', function () {
      const fd = new FileDescriptor(flags('r+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (rs)', function () {
      const fd = new FileDescriptor(flags('rs'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (rs+)', function () {
      const fd = new FileDescriptor(flags('rs+'));
      assert.isTrue(fd.isRead());
    });

    it('not opened for reading (w)', function () {
      const fd = new FileDescriptor(flags('w'));
      assert.isFalse(fd.isRead());
    });

    it('not opened for reading (wx)', function () {
      const fd = new FileDescriptor(flags('wx'));
      assert.isFalse(fd.isRead());
    });

    it('opened for reading (w+)', function () {
      const fd = new FileDescriptor(flags('w+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (wx+)', function () {
      const fd = new FileDescriptor(flags('wx+'));
      assert.isTrue(fd.isRead());
    });

    it('not opened for reading (a)', function () {
      const fd = new FileDescriptor(flags('a'));
      assert.isFalse(fd.isRead());
    });

    it('not opened for reading (ax)', function () {
      const fd = new FileDescriptor(flags('ax'));
      assert.isFalse(fd.isRead());
    });

    it('opened for reading (a+)', function () {
      const fd = new FileDescriptor(flags('a+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (ax+)', function () {
      const fd = new FileDescriptor(flags('ax+'));
      assert.isTrue(fd.isRead());
    });

    it('opened for reading (O_CREAT | O_RDONLY)', function () {
      const fd = new FileDescriptor(constants.O_CREAT | constants.O_RDONLY);
      assert.isTrue(fd.isRead());
    });
  });

  describe('#isWrite()', function () {
    it('not opened for writing (r)', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.isFalse(fd.isWrite());
    });

    it('opened for writing (r+)', function () {
      const fd = new FileDescriptor(flags('r+'));
      assert.isTrue(fd.isWrite());
    });

    it('not opened for writing (rs)', function () {
      const fd = new FileDescriptor(flags('rs'));
      assert.isFalse(fd.isWrite());
    });

    it('opened for writing (rs+)', function () {
      const fd = new FileDescriptor(flags('rs+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (w)', function () {
      const fd = new FileDescriptor(flags('w'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (wx)', function () {
      const fd = new FileDescriptor(flags('wx'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (w+)', function () {
      const fd = new FileDescriptor(flags('w+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (wx+)', function () {
      const fd = new FileDescriptor(flags('wx+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (a)', function () {
      const fd = new FileDescriptor(flags('a'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (ax)', function () {
      const fd = new FileDescriptor(flags('ax'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (a+)', function () {
      const fd = new FileDescriptor(flags('a+'));
      assert.isTrue(fd.isWrite());
    });

    it('opened for writing (ax+)', function () {
      const fd = new FileDescriptor(flags('ax+'));
      assert.isTrue(fd.isWrite());
    });

    it('not opened for writing (O_CREAT | O_RDONLY)', function () {
      const fd = new FileDescriptor(constants.O_CREAT | constants.O_RDONLY);
      assert.isFalse(fd.isWrite());
    });
  });

  describe('#isExclusive()', function () {
    it('not opened exclusive (r)', function () {
      const fd = new FileDescriptor(flags('r'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (r+)', function () {
      const fd = new FileDescriptor(flags('r+'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (rs)', function () {
      const fd = new FileDescriptor(flags('rs'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (rs+)', function () {
      const fd = new FileDescriptor(flags('rs+'));
      assert.isFalse(fd.isExclusive());
    });

    it('not opened exclusive (w)', function () {
      const fd = new FileDescriptor(flags('w'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (wx)', function () {
      const fd = new FileDescriptor(flags('wx'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened exclusive (w+)', function () {
      const fd = new FileDescriptor(flags('w+'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (wx+)', function () {
      const fd = new FileDescriptor(flags('wx+'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened exclusive (a)', function () {
      const fd = new FileDescriptor(flags('a'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (ax)', function () {
      const fd = new FileDescriptor(flags('ax'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened exclusive (a+)', function () {
      const fd = new FileDescriptor(flags('a+'));
      assert.isFalse(fd.isExclusive());
    });

    it('opened exclusive (ax+)', function () {
      const fd = new FileDescriptor(flags('ax+'));
      assert.isTrue(fd.isExclusive());
    });

    it('not opened for exclusive (O_CREAT | O_RDONLY)', function () {
      const fd = new FileDescriptor(constants.O_CREAT | constants.O_RDONLY);
      assert.isFalse(fd.isExclusive());
    });
  });
});
