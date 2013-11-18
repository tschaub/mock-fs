var path = require('path');

var Binding = require('../../lib/binding').Binding;
var FileSystem = require('../../lib/filesystem');
var assert = require('../helper').assert;

var constants = process.binding('constants');

describe('Binding', function() {

  var system;
  beforeEach(function() {
    system = FileSystem.create({
      'mock-dir': {
        'one.txt': 'one content',
        'two.txt': FileSystem.file({
          content: 'two content',
          mode: 0644,
          atime: new Date(1),
          ctime: new Date(2),
          mtime: new Date(3)
        }),
        'three.bin': new Buffer([1, 2, 3]),
        'empty': {}
      }
    });
  });

  describe('constructor', function() {

    it('creates a new instance', function() {
      var binding = new Binding(system);
      assert.instanceOf(binding, Binding);
    });

  });

  describe('#getSystem()', function() {
    var binding = new Binding(system);
    assert.equal(binding.getSystem(), system);
  });

  describe('#setSystem()', function() {
    var firstSystem = new FileSystem();
    var binding = new Binding(firstSystem);
    assert.equal(binding.getSystem(), firstSystem);

    binding.setSystem(system);
    assert.equal(binding.getSystem(), system);
  });

  describe('#Stats', function() {

    it('is a stats constructor', function() {
      var binding = new Binding(system);
      assert.isFunction(binding.Stats);
    });
  });

  describe('#stat()', function() {

    it('calls callback with a Stats instance', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(stats, binding.Stats);
        done();
      });
    });

    it('returns a Stats instance when called synchronously', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(stats, binding.Stats);
    });

    it('identifies files (async)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
        done();
      });
    });

    it('identifies files (sync)', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'one.txt'));
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
    });

    it('identifies directories (async)', function(done) {
      var binding = new Binding(system);
      binding.stat('mock-dir', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('identifies directories (sync)', function() {
      var binding = new Binding(system);
      var stats = binding.stat('mock-dir');
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
    });

    it('includes atime, ctime, and mtime', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.atime.getTime(), new Date(1).getTime());
        assert.equal(stats.ctime.getTime(), new Date(2).getTime());
        assert.equal(stats.mtime.getTime(), new Date(3).getTime());
        done();
      });
    });

    it('includes mode with file permissions (default)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & 0777, 0666);
        done();
      });
    });

    it('includes mode with file permissions (custom)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & 0777, 0644);
        done();
      });
    });

    it('includes size in bytes (async)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.size, 11);
        done();
      });
    });

    it('includes size in bytes (sync)', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'three.bin'));
      assert.equal(stats.size, 3);
    });

  });

  describe('#readdir()', function() {

    it('calls callback with file list', function(done) {
      var binding = new Binding(system);
      binding.readdir('mock-dir', function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(
            items.sort(), ['empty', 'one.txt', 'three.bin', 'two.txt']);
        done();
      });
    });

    it('calls callback with file list (sync)', function() {
      var binding = new Binding(system);
      var items = binding.readdir('mock-dir');
      assert.isArray(items);
      assert.deepEqual(
          items.sort(), ['empty', 'one.txt', 'three.bin', 'two.txt']);
    });

    it('calls callback with error for bogus dir', function(done) {
      var binding = new Binding(system);
      binding.readdir('bogus', function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

    it('calls callback with error for file path', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'one.txt'), function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

  });

});
