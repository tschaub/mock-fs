'use strict';

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

  describe('#getBirthtime()', function() {
    it('returns a date', function() {
      var item = new Item();
      var date = item.getBirthtime();
      assert.instanceOf(date, Date);
      assert.isTrue(date <= new Date());
    });
  });

  describe('#setBirthtime()', function() {
    it('sets the birthtime', function() {
      var item = new Item();
      var date = new Date();
      item.setBirthtime(date);
      assert.equal(item.getBirthtime(), date);
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
      item.setMode(parseInt('0644', 8));
      assert.equal(item.getMode(), parseInt('0644', 8));
    });

    it('updates the ctime', function() {
      var item = new Item();
      var original = new Date(1);
      item.setCTime(original);
      item.setMode(parseInt('0644', 8));
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

  if (process.getgid && process.getuid) {
    var uid = process.getuid();
    var gid = process.getgid();

    var item;
    beforeEach(function() {
      item = new Item();
    });

    describe('#canRead()', function() {
      it('returns true if owner and 0700', function() {
        item.setMode(parseInt('0700', 8));
        assert.isTrue(item.canRead());
      });

      it('returns true if owner and 0600', function() {
        item.setMode(parseInt('0600', 8));
        assert.isTrue(item.canRead());
      });

      it('returns true if owner and 0500', function() {
        item.setMode(parseInt('0500', 8));
        assert.isTrue(item.canRead());
      });

      it('returns true if owner and 0400', function() {
        item.setMode(parseInt('0400', 8));
        assert.isTrue(item.canRead());
      });

      it('returns false if owner and 0300', function() {
        item.setMode(parseInt('0300', 8));
        assert.isFalse(item.canRead());
      });

      it('returns false if owner and 0200', function() {
        item.setMode(parseInt('0200', 8));
        assert.isFalse(item.canRead());
      });

      it('returns false if owner and 0100', function() {
        item.setMode(parseInt('0100', 8));
        assert.isFalse(item.canRead());
      });

      it('returns false if not owner and 0700 (different user)', function() {
        item.setUid(uid + 1);
        item.setMode(parseInt('0700', 8));
        assert.isFalse(item.canRead());
      });

      it('returns false if not owner and 0700 (different group)', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0700', 8));
        assert.isFalse(item.canRead());
      });

      it('returns false if owner and 0170', function() {
        item.setMode(parseInt('0170', 8));
        assert.isFalse(item.canRead());
      });

      it('returns true if in group and 0170', function() {
        item.setUid(uid + 1);
        item.setMode(parseInt('0170', 8));
        assert.isTrue(item.canRead());
      });

      it('returns false if not in group and 0770', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0770', 8));
        assert.isFalse(item.canRead());
      });

      it('returns true if not in group and 0777', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0777', 8));
        assert.isTrue(item.canRead());
      });
    });

    describe('#canWrite()', function() {
      it('returns true if owner and 0700', function() {
        item.setMode(parseInt('0700', 8));
        assert.isTrue(item.canWrite());
      });

      it('returns true if owner and 0600', function() {
        item.setMode(parseInt('0600', 8));
        assert.isTrue(item.canWrite());
      });

      it('returns false if owner and 0500', function() {
        item.setMode(parseInt('0500', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns false if owner and 0400', function() {
        item.setMode(parseInt('0400', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns true if owner and 0300', function() {
        item.setMode(parseInt('0300', 8));
        assert.isTrue(item.canWrite());
      });

      it('returns true if owner and 0200', function() {
        item.setMode(parseInt('0200', 8));
        assert.isTrue(item.canWrite());
      });

      it('returns false if owner and 0100', function() {
        item.setMode(parseInt('0100', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns false if not owner and 0700 (different user)', function() {
        item.setUid(uid + 1);
        item.setMode(parseInt('0700', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns false if not owner and 0700 (different group)', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0700', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns false if owner and 0170', function() {
        item.setMode(parseInt('0170', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns true if in group and 0170', function() {
        item.setUid(uid + 1);
        item.setMode(parseInt('0170', 8));
        assert.isTrue(item.canWrite());
      });

      it('returns false if not in group and 0770', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0770', 8));
        assert.isFalse(item.canWrite());
      });

      it('returns true if not in group and 0777', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0777', 8));
        assert.isTrue(item.canWrite());
      });
    });

    describe('#canExecute()', function() {
      it('returns true if owner and 0700', function() {
        item.setMode(parseInt('0700', 8));
        assert.isTrue(item.canExecute());
      });

      it('returns false if owner and 0600', function() {
        item.setMode(parseInt('0600', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns true if owner and 0500', function() {
        item.setMode(parseInt('0500', 8));
        assert.isTrue(item.canExecute());
      });

      it('returns false if owner and 0400', function() {
        item.setMode(parseInt('0400', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns true if owner and 0300', function() {
        item.setMode(parseInt('0300', 8));
        assert.isTrue(item.canExecute());
      });

      it('returns false if owner and 0200', function() {
        item.setMode(parseInt('0200', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns true if owner and 0100', function() {
        item.setMode(parseInt('0100', 8));
        assert.isTrue(item.canExecute());
      });

      it('returns false if not owner and 0700 (different user)', function() {
        item.setUid(uid + 1);
        item.setMode(parseInt('0700', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns false if not owner and 0700 (different group)', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0700', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns false if owner and 0270', function() {
        item.setMode(parseInt('0270', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns true if in group and 0270', function() {
        item.setUid(uid + 1);
        item.setMode(parseInt('0270', 8));
        assert.isTrue(item.canExecute());
      });

      it('returns false if not in group and 0770', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0770', 8));
        assert.isFalse(item.canExecute());
      });

      it('returns true if not in group and 0777', function() {
        item.setUid(uid + 1);
        item.setGid(gid + 1);
        item.setMode(parseInt('0777', 8));
        assert.isTrue(item.canExecute());
      });
    });
  }
});
