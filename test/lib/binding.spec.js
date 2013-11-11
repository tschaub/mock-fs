var path = require('path');

var Binding = require('../../lib/binding').Binding;
var mock = require('../../lib/filesystem');
var assert = require('../helper').assert;

var constants = process.binding('constants');

describe('Binding', function() {

  var system;
  beforeEach(function() {
    system = mock.create({
      'mock-dir': {
        'one.txt': 'one content',
        'two.txt': mock.file({
          content: 'two content',
          mode: 0644,
          atime: new Date(1),
          ctime: new Date(2),
          mtime: new Date(3)
        })
      }
    });
  });

  describe('constructor', function() {

    it('creates a new instanc', function() {
      var binding = new Binding(system);
      assert.instanceOf(binding, Binding);
    });

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

  });

});
