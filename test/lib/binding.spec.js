'use strict';

var path = require('path');

var Binding = require('../../lib/binding');
var Directory = require('../../lib/directory');
var SymbolicLink = require('../../lib/symlink');
var File = require('../../lib/file');
var FileSystem = require('../../lib/filesystem');
var helper = require('../helper');
var constants = require('constants');

var assert = helper.assert;
var flags = helper.flags;


describe('Binding', function() {

  var system;
  beforeEach(function() {
    system = FileSystem.create({
      'mock-dir': {
        'one.txt': 'one content',
        'two.txt': FileSystem.file({
          content: 'two content',
          mode: parseInt('0644', 8),
          atime: new Date(1),
          ctime: new Date(2),
          mtime: new Date(3),
          birthtime: new Date(4)
        }),
        'one-link.txt': FileSystem.symlink({path: './one.txt'}),
        'one-link2.txt': FileSystem.symlink({path: './one-link.txt'}),
        'three.bin': new Buffer([1, 2, 3]),
        'empty': {},
        'non-empty': {
          'a.txt': FileSystem.file({
            content: 'a  content',
            mode: parseInt('0644', 8),
            atime: new Date(1),
            ctime: new Date(2),
            mtime: new Date(3),
            birthtime: new Date(4)
          }),
          'b.txt': 'b content'
        },
        'dir-link': FileSystem.symlink({path: './non-empty'}),
        'dir-link2': FileSystem.symlink({path: './dir-link'}),
        'dead-link': FileSystem.symlink({path: './non-a-real-file'})
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

    it('includes atime, ctime, mtime and birthtime', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.atime.getTime(), new Date(1).getTime());
        assert.equal(stats.ctime.getTime(), new Date(2).getTime());
        assert.equal(stats.mtime.getTime(), new Date(3).getTime());
        assert.equal(stats.birthtime.getTime(), new Date(4).getTime());
        done();
      });
    });

    it('includes mode with file permissions (default)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0666', 8));
        done();
      });
    });

    it('includes mode with file permissions (custom)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0644', 8));
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

    it('includes non-zero size for directories', function() {
      var binding = new Binding(system);
      var stats = binding.stat('mock-dir');
      assert.isNumber(stats.size);
      assert.isTrue(stats.size > 0);
    });

    it('includes uid for files', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'two.txt'));
      if (process.getuid) {
        assert.equal(stats.uid, process.getuid());
      }
    });

    it('includes uid for directories', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'empty'));
      if (process.getuid) {
        assert.equal(stats.uid, process.getuid());
      }
    });

    it('includes gid for files', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'two.txt'));
      if (process.getgid) {
        assert.equal(stats.gid, process.getgid());
      }
    });

    it('includes gid for directories', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'empty'));
      if (process.getgid) {
        assert.equal(stats.gid, process.getgid());
      }
    });

    it('retrieves stats of files relative to symbolic linked directories', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'dir-link', 'a.txt'));
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats.mode & 0x1FF, parseInt('0644', 8));
      if (process.getuid) {
        assert.equal(stats.uid, process.getuid());
      }
      if (process.getgid) {
        assert.equal(stats.gid, process.getgid());
      }
    });

  });

  describe('#realpath()', function() {

    function assertEqualPaths(actual, expected) {
      if (path._makeLong(expected) === expected) {
        // not on Windows
        assert.equal(actual, expected);
      } else {
        assert.equal(actual.toLowerCase(), path._makeLong(expected).toLowerCase());
      }
    }

    it('returns the real path for a regular file', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/one.txt', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('returns the real path for a directory', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/empty', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/empty'));
        done();
      });
    });

    it('returns the real path for a symlinked file', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/one-link.txt', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('returns the real path for a deeply symlinked file', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/one-link2.txt', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('returns the real path for a symlinked directory', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/dir-link', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/non-empty'));
        done();
      });
    });

    it('returns the real path for a deeply symlinked directory', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/dir-link2', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/non-empty'));
        done();
      });
    });

    it('returns the real path for a file in a symlinked directory', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/dir-link/b.txt', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/non-empty/b.txt'));
        done();
      });
    });

    it('accepts a buffer', function(done) {
      var binding = new Binding(system);
      binding.realpath(new Buffer('mock-dir/one.txt'), 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('can return a buffer', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/one.txt', 'buffer', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assert.equal(Buffer.isBuffer(realPath), true);
        assertEqualPaths(realPath.toString(), path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('throws ENOENT for a non-existent file', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/bogus-path', 'utf-8', function(err, realPath) {
        if (!err || realPath) {
          return done(new Error('Expected ENOENT'));
        }
        assert.equal(err.code, 'ENOENT');
        done();
      });
    });

    it('throws ENOTDIR for a file treated like a directory', function(done) {
      var binding = new Binding(system);
      binding.realpath('mock-dir/one.txt/foo', 'utf-8', function(err, realPath) {
        if (!err || realPath) {
          return done(new Error('Expected ENOTDIR'));
        }
        assert.equal(err.code, 'ENOTDIR');
        done();
      });
    });

  });

  describe('#fstat()', function() {

    it('calls callback with a Stats instance', function(done) {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(stats, binding.Stats);
        done();
      });
    });

    it('returns a Stats instance when called synchronously', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      var stats = binding.fstat(fd);
      assert.instanceOf(stats, binding.Stats);
    });

    it('identifies files (async)', function(done) {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
        done();
      });
    });

    it('identifies directories (async)', function(done) {
      var binding = new Binding(system);
      var fd = binding.open('mock-dir', flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });


    it('includes size in bytes (async)', function(done) {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.size, 11);
        done();
      });
    });

    it('includes size in bytes (sync)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'three.bin'), flags('r'));
      var stats = binding.fstat(fd);
      assert.equal(stats.size, 3);
    });

    it('includes non-zero size for directories', function() {
      var binding = new Binding(system);
      var fd = binding.open('mock-dir', flags('r'));
      var stats = binding.fstat(fd);
      assert.isNumber(stats.size);
      assert.isTrue(stats.size > 0);
    });

  });

  describe('#readdir()', function() {

    it('calls callback with file list', function(done) {
      var binding = new Binding(system);
      binding.readdir('mock-dir', function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(items.sort(),
            ['dead-link', 'dir-link', 'dir-link2', 'empty', 'non-empty',
                'one-link.txt', 'one-link2.txt', 'one.txt', 'three.bin',
                'two.txt']);
        done();
      });
    });

    it('accepts "buffer" encoding', function(done) {
      var binding = new Binding(system);
      binding.readdir('mock-dir', 'buffer', function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        items.forEach(function(item) {
          assert.equal(Buffer.isBuffer(item), true);
        });
        var strings = items.map(function(item) {
          return item.toString();
        });
        assert.deepEqual(strings.sort(),
            ['dead-link', 'dir-link', 'dir-link2', 'empty', 'non-empty',
                'one-link.txt', 'one-link2.txt', 'one.txt', 'three.bin',
                'two.txt']);
        done();
      });
    });

    it('returns a file list (sync)', function() {
      var binding = new Binding(system);
      var items = binding.readdir('mock-dir');
      assert.isArray(items);
      assert.deepEqual(items.sort(),
          ['dead-link', 'dir-link', 'dir-link2', 'empty', 'non-empty',
              'one-link.txt', 'one-link2.txt', 'one.txt', 'three.bin',
              'two.txt']);
    });

    it('calls callback with file list for symbolic linked dir', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'dir-link'), function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(items.sort(), ['a.txt', 'b.txt']);
        done();
      });
    });

    it('calls callback with file list for link to symbolic linked dir', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'dir-link2'), function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(items.sort(), ['a.txt', 'b.txt']);
        done();
      });
    });

    it('calls callback with file list for symbolic linked dir (sync)', function() {
      var binding = new Binding(system);
      var items = binding.readdir(path.join('mock-dir', 'dir-link'));
      assert.isArray(items);
      assert.deepEqual(items.sort(), ['a.txt', 'b.txt']);
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

    it('calls callback with error for dead symbolic link', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'dead-link'), function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

    it('calls callback with error for symbolic link to file', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'one-link.txt'), function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

    it('calls callback with error for link to symbolic link to file', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'one-link2.txt'), function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

  });

  describe('#open()', function() {

    it('creates a file descriptor for reading (r)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (r)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('r'));
      });
    });

    it('creates a file descriptor for reading and writing (r+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r+'));
      assert.isNumber(fd);
    });

    it('does not truncate (r+)', function() {
      var binding = new Binding(system);
      binding.open(path.join('mock-dir', 'two.txt'), flags('r+'));
      var file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'two content');
    });

    it('generates error if file does not exist (r+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('r+'));
      });
    });

    it('creates a file descriptor for reading (rs)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('rs'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (rs)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('rs'));
      });
    });

    it('creates a file descriptor for reading and writing (rs+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('rs+'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (rs+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('rs+'));
      });
    });

    it('opens a new file for writing (w)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('w'), parseInt('0644', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0644', 8));
    });

    it('truncates an existing file for writing (w)', function() {
      var binding = new Binding(system);
      binding.open(path.join('mock-dir', 'two.txt'), flags('w'),
          parseInt('0666', 8));
      var file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (wx)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'two.txt'), flags('wx'));
      });
    });

    it('opens a new file for reading and writing (w+)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('w+'), parseInt('0644', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0644', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('truncates an existing file for writing (w+)', function() {
      var binding = new Binding(system);
      binding.open(
          path.join('mock-dir', 'one.txt'), flags('w+'), parseInt('0666', 8));
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), '');
    });

    it('opens a new file for reading and writing (wx+)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('wx+'), parseInt('0644', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0644', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (wx+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'one.txt'), flags('wx+'),
            parseInt('0666', 8));
      });
    });

    it('opens a new file for appending (a)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('a'), parseInt('0666', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0666', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending (a)', function() {
      var binding = new Binding(system);
      binding.open(
          path.join('mock-dir', 'one.txt'), flags('a'), parseInt('0666', 8));
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'one content');
    });

    it('opens a new file for appending (ax)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('ax'), parseInt('0664', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0664', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (ax)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'one.txt'), flags('ax'),
            parseInt('0666', 8));
      });
    });

    it('opens a new file for appending and reading (a+)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('a+'), parseInt('0666', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0666', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending and reading (a+)', function() {
      var binding = new Binding(system);
      binding.open(
          path.join('mock-dir', 'one.txt'), flags('a+'), parseInt('0666', 8));
      var file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'two content');
    });

    it('opens a new file for appending and reading (ax+)', function() {
      var binding = new Binding(system);
      binding.open('new.txt', flags('ax+'), parseInt('0666', 8));
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0666', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending and reading (ax+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'two.txt'), flags('ax+'),
            parseInt('0666', 8));
      });
    });

  });

  describe('#close()', function() {

    it('closes an existing file descriptor', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('w'), parseInt('0644', 8));
      binding.close(fd);
    });

    it('fails for closed file descriptor', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('w'), parseInt('0644', 8));
      binding.close(fd);
      assert.throws(function() {
        binding.close(fd);
      });
    });

  });

  describe('#read()', function() {

    it('reads from a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      var buffer = new Buffer(11);
      var read = binding.read(fd, buffer, 0, 11, 0);
      assert.equal(read, 11);
      assert.equal(String(buffer), 'two content');
    });

    it('interprets null position as current position', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      var buffer = new Buffer(4);

      // chunk 1
      assert.equal(binding.read(fd, buffer, 0, 11, null), 4);
      assert.equal(String(buffer), 'one ');

      // chunk 2
      assert.equal(binding.read(fd, buffer, 0, 11, null), 4);
      assert.equal(String(buffer), 'cont');

      // chunk 3
      assert.equal(binding.read(fd, buffer, 0, 11, null), 3);
      assert.equal(String(buffer.slice(0, 3)), 'ent');

    });

    it('reads from a symbolic link', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one-link.txt'), flags('r'));
      var buffer = new Buffer(11);
      var read = binding.read(fd, buffer, 0, 11, 0);
      assert.equal(read, 11);
      assert.equal(String(buffer), 'one content');
    });

    it('throws if not open for reading', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('w'));
      var buffer = new Buffer(11);
      assert.throws(function() {
        binding.read(fd, buffer, 0, 11, 0);
      });
    });

  });

  describe('#write()', function() {

    it('writes to a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'new.txt'), flags('w'));
      var buffer = new Buffer('new content');
      var written = binding.write(fd, buffer, 0, 11, 0);
      assert.equal(written, 11);
      var file = system.getItem(path.join('mock-dir', 'new.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('can overwrite a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('w'));
      var buffer = new Buffer('bingo');
      var written = binding.write(fd, buffer, 0, 5, null);
      assert.equal(written, 5);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'bingo');
    });

    it('can append to a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      var buffer = new Buffer(' more');
      var written = binding.write(fd, buffer, 0, 5, null);
      assert.equal(written, 5);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'one content more');
    });

    it('can overwrite part of a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      var buffer = new Buffer('new');
      var written = binding.write(fd, buffer, 0, 3, 0);
      assert.equal(written, 3);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('throws if not open for writing', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      var buffer = new Buffer('some content');
      assert.throws(function() {
        binding.write(fd, buffer, 0, 12, 0);
      });
    });

  });

  describe('#writeBuffers()', function() {

    it('writes to a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'new.txt'), flags('w'));
      var buffers = [
        new Buffer('new '),
        new Buffer('content')
      ];
      var written = binding.writeBuffers(fd, buffers);
      assert.equal(written, 11);
      var file = system.getItem(path.join('mock-dir', 'new.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('can append to a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      var buffers = [
        new Buffer(' more'),
        new Buffer(' content')
      ];
      var written = binding.writeBuffers(fd, buffers);
      assert.equal(written, 13);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'one content more content');
    });

    it('can overwrite part of a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      var buffers = [
        new Buffer('n'),
        new Buffer('e'),
        new Buffer('w')
      ];
      var written = binding.writeBuffers(fd, buffers, 0);
      assert.equal(written, 3);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('throws if not open for writing', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      var buffers = [new Buffer('some content')];
      assert.throws(function() {
        binding.writeBuffers(fd, buffers);
      });
    });

  });

  describe('#rename()', function() {

    it('allows files to be renamed', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'empty', 'new.txt');
      binding.rename(oldPath, newPath, function(_) {
        var stats = binding.stat(newPath);
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
        assert.equal(stats.size, 11);
        done();
      });
    });

    it('allows files to be renamed (sync)', function() {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'new.txt');
      binding.rename(oldPath, newPath);
      var stats = binding.stat(newPath);
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats.size, 11);
    });

    it('replaces existing files (sync)', function() {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'two.txt');
      binding.rename(oldPath, newPath);
      var stats = binding.stat(newPath);
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats.size, 11);
    });

    it('allows directories to be renamed', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'empty');
      var newPath = path.join('mock-dir', 'new');
      binding.rename(oldPath, newPath, function(_) {
        var stats = binding.stat(newPath);
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('allows directories to be renamed (sync)', function() {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir');
      var newPath = path.join('new-dir');
      binding.rename(oldPath, newPath);
      var stats = binding.stat(newPath);
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
      var items = binding.readdir(newPath);
      assert.isArray(items);
      assert.deepEqual(items.sort(),
          ['dead-link', 'dir-link', 'dir-link2', 'empty', 'non-empty',
              'one-link.txt', 'one-link2.txt', 'one.txt', 'three.bin',
              'two.txt']);
    });

    it('calls callback with error for bogus old path', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'bogus');
      var newPath = path.join('mock-dir', 'new');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

    it('calls callback with error for file->dir rename', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'empty');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

    it('calls callback with error for dir->file rename', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'empty');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

  });

  describe('#mkdir()', function() {

    it('creates a new directory', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'foo');
      binding.mkdir(dirPath, parseInt('0755', 8));
      var dir = system.getItem(dirPath);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), parseInt('0755', 8));
    });

    it('fails if parent does not exist', function() {
      var binding = new Binding(system);
      var dirPath = path.join('bogus', 'path');
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8));
      });
    });

    it('fails if directory exists', function() {
      var binding = new Binding(system);
      var dirPath = 'mock-dir';
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8));
      });
    });

    it('fails if file exists', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'one.txt');
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8));
      });
    });

  });

  describe('#rmdir()', function() {

    it('removes an empty directory', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'empty');
      binding.rmdir(dirPath);
      assert.isNull(system.getItem(dirPath));
    });

    it('fails if directory is not empty', function() {
      var binding = new Binding(system);
      var dirPath = 'mock-dir';
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

    it('fails if directory does not exist', function() {
      var binding = new Binding(system);
      var dirPath = path.join('bogus', 'path');
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

    it('fails if a file exists', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'one.txt');
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

  });

  describe('#ftruncate()', function() {

    it('truncates a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r+'));
      binding.ftruncate(fd, 3);
      var file = system.getItem(pathname);
      assert.equal(String(file.getContent()), 'one');
    });

    it('fails if directory', function() {
      var binding = new Binding(system);
      var fd = binding.open('mock-dir', flags('r'));
      assert.throws(function() {
        binding.ftruncate(fd, 3);
      });
    });

    it('fails if not open for writing', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      assert.throws(function() {
        binding.ftruncate(fd, 4);
      });
    });

  });

  describe('#chown()', function() {

    it('sets the uid and gid for a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      binding.chown(pathname, 3, 4);
      var file = system.getItem(pathname);
      assert.equal(file.getUid(), 3);
      assert.equal(file.getGid(), 4);
    });

    it('sets the uid and gid for a directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      binding.chown(pathname, 5, 6);
      var dir = system.getItem(pathname);
      assert.equal(dir.getUid(), 5);
      assert.equal(dir.getGid(), 6);
    });

  });

  describe('#fchown()', function() {

    it('sets the uid and gid for a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.fchown(fd, 3, 4);
      var file = system.getItem(pathname);
      assert.equal(file.getUid(), 3);
      assert.equal(file.getGid(), 4);
    });

    it('sets the uid and gid for a directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      var fd = binding.open(pathname, flags('r'));
      binding.fchown(fd, 5, 6);
      var dir = system.getItem(pathname);
      assert.equal(dir.getUid(), 5);
      assert.equal(dir.getGid(), 6);
    });

  });

  describe('#chmod()', function() {

    it('sets the mode for a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'two.txt');
      binding.chmod(pathname, parseInt('0644', 8));
      var file = system.getItem(pathname);
      assert.equal(file.getMode(), parseInt('0644', 8));
    });

    it('sets the mode for a directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      binding.chmod(pathname, parseInt('0755', 8));
      var dir = system.getItem(pathname);
      assert.equal(dir.getMode(), parseInt('0755', 8));
    });

  });

  describe('#fchmod()', function() {

    it('sets the mode for a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.fchmod(fd, parseInt('0664', 8));
      var file = system.getItem(pathname);
      assert.equal(file.getMode(), parseInt('0664', 8));
    });

    it('sets the mode for a directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      var fd = binding.open(pathname, flags('r'));
      binding.fchmod(fd, parseInt('0775', 8));
      var dir = system.getItem(pathname);
      assert.equal(dir.getMode(), parseInt('0775', 8));
    });

  });

  describe('#unlink()', function() {

    it('deletes a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      binding.unlink(pathname);
      assert.isNull(system.getItem(pathname));
    });

    it('fails for directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      assert.throws(function() {
        binding.unlink(pathname);
      });
    });

    it('fails for bogus path', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'bogus.txt');
      assert.throws(function() {
        binding.unlink(pathname);
      });
    });

  });

  describe('#utimes()', function() {

    it('updates atime and mtime for a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      binding.utimes(pathname, 100, 200);
      var item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 100 * 1000);
      assert.equal(item.getMTime().getTime(), 200 * 1000);
    });

    it('updates atime and mtime for a directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      binding.utimes(pathname, 300, 400);
      var item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 300 * 1000);
      assert.equal(item.getMTime().getTime(), 400 * 1000);
    });

    it('fails for a bogus path', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'bogus.txt');
      assert.throws(function() {
        binding.utimes(pathname, 300, 400);
      });
    });

  });

  describe('#futimes()', function() {

    it('updates atime and mtime for a file', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.futimes(fd, 100, 200);
      var item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 100 * 1000);
      assert.equal(item.getMTime().getTime(), 200 * 1000);
    });

    it('updates atime and mtime for a directory', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'empty');
      var fd = binding.open(pathname, flags('r'));
      binding.futimes(fd, 300, 400);
      var item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 300 * 1000);
      assert.equal(item.getMTime().getTime(), 400 * 1000);
    });

  });

  describe('#fsync()', function() {

    it('synchronize file state (noop)', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.fsync(fd);
    });

    it('fails for closed file descriptor', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.close(fd);
      assert.throws(function() {
        binding.fsync(fd);
      });
    });

  });

  describe('#fdatasync()', function() {

    it('synchronize file state (noop)', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.fdatasync(fd);
    });

    it('fails for closed file descriptor', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one.txt');
      var fd = binding.open(pathname, flags('r'));
      binding.close(fd);
      assert.throws(function() {
        binding.fdatasync(fd);
      });
    });

  });

  describe('#link()', function() {

    it('creates a link to a file', function() {
      var binding = new Binding(system);
      var source = path.join('mock-dir', 'one.txt');
      var dest = path.join('mock-dir', 'link.txt');
      binding.link(source, dest);
      var link = system.getItem(dest);
      assert.instanceOf(link, File);
      assert.equal(String(link.getContent()), 'one content');
    });

    it('fails if dest exists', function() {
      var binding = new Binding(system);
      var source = path.join('mock-dir', 'one.txt');
      var dest = path.join('mock-dir', 'two.txt');
      assert.throws(function() {
        binding.link(source, dest);
      });
    });

    it('fails if source is directory', function() {
      var binding = new Binding(system);
      var source = path.join('mock-dir', 'empty');
      var dest = path.join('mock-dir', 'link');
      assert.throws(function() {
        binding.link(source, dest);
      });
    });

  });

  describe('#symlink()', function() {

    it('creates a symbolic link to a file', function() {
      var binding = new Binding(system);
      var source = path.join('.', 'one.txt');
      var dest = path.join('mock-dir', 'link.txt');
      binding.symlink(source, dest);
      var link = system.getItem(dest);
      assert.instanceOf(link, SymbolicLink);
      assert.equal(link.getPath(), source);
    });

    it('fails if dest exists', function() {
      var binding = new Binding(system);
      var source = path.join('.', 'one.txt');
      var dest = path.join('mock-dir', 'two.txt');
      assert.throws(function() {
        binding.symlink(source, dest);
      });
    });

    it('works if source is directory', function() {
      var binding = new Binding(system);
      var source = path.join('mock-dir', 'empty');
      var dest = path.join('mock-dir', 'link');
      binding.symlink(source, dest);
      var link = system.getItem(dest);
      assert.instanceOf(link, SymbolicLink);
      assert.equal(link.getPath(), source);
    });

  });

  describe('#readlink()', function() {

    it('reads the symbolic link', function() {
      var binding = new Binding(system);
      var srcPath = binding.readlink(path.join('mock-dir', 'one-link.txt'));
      assert.equal(srcPath, './one.txt');
    });

    it('can return "buffer" encoding', function() {
      var binding = new Binding(system);
      var srcPath = binding.readlink(path.join('mock-dir', 'one-link.txt'), 'buffer');
      assert.equal(Buffer.isBuffer(srcPath), true);
      assert.equal(srcPath.toString(), './one.txt');
    });

    it('fails for regular files', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.readlink(path.join('mock-dir', 'one.txt'));
      });
    });

    it('fails for directories', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.readlink(path.join('mock-dir', 'empty'));
      });
    });

    it('fails for bogus paths', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.readlink(path.join('mock-dir', 'bogus'));
      });
    });

  });

  describe('#lstat()', function() {

    it('stats symbolic links', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one-link.txt');
      var stats = binding.lstat(pathname);
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(stats.size, binding.readlink(pathname).length);
    });

  });

  describe('#access()', function() {

    it('works if file exists', function() {
      var binding = new Binding(system);
      var pathname = path.join('mock-dir', 'one-link.txt');
      binding.access(pathname);
    });

    if (process.getuid && process.getgid) {

      it('fails in case of insufficient user permissions', function() {
        var binding = new Binding(system);
        var item = system.getItem(path.join('mock-dir', 'one.txt'));
        item.setMode(parseInt('0077', 8));
        assert.throws(function() {
          binding.access(path.join('mock-dir', 'one.txt'), 1);
        }, /EACCES/);
      });

      it('fails in case of insufficient group permissions', function() {
        var binding = new Binding(system);
        var item = system.getItem(path.join('mock-dir', 'one.txt'));
        item.setUid(process.getuid() + 1);
        item.setMode(parseInt('0707', 8));
        assert.throws(function() {
          binding.access(path.join('mock-dir', 'one.txt'), 2);
        }, /EACCES/);
      });

      it('fails in case of insufficient permissions', function() {
        var binding = new Binding(system);
        var item = system.getItem(path.join('mock-dir', 'one.txt'));
        item.setUid(process.getuid() + 1);
        item.setGid(process.getgid() + 1);
        item.setMode(parseInt('0771', 8));
        assert.throws(function() {
          binding.access(path.join('mock-dir', 'one.txt'), 5);
        }, /EACCES/);
      });

    }

    it('fails for bogus paths', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.access(path.join('mock-dir', 'bogus'));
      }, /ENOENT/);
    });

  });

});
