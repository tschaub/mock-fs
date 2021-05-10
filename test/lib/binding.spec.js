'use strict';

const path = require('path');

const Binding = require('../../lib/binding');
const Directory = require('../../lib/directory');
const SymbolicLink = require('../../lib/symlink');
const File = require('../../lib/file');
const FileSystem = require('../../lib/filesystem');
const helper = require('../helper');
const constants = require('constants');
const bufferFrom = require('../../lib/buffer').from;
const bufferAlloc = require('../../lib/buffer').alloc;

const assert = helper.assert;
const assertEqualPaths = helper.assertEqualPaths;
const flags = helper.flags;

describe('Binding', function() {
  let system;
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
        'three.bin': bufferFrom([1, 2, 3]),
        empty: {},
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
      const binding = new Binding(system);
      assert.instanceOf(binding, Binding);
    });
  });

  describe('#getSystem()', function() {
    const binding = new Binding(system);
    assert.equal(binding.getSystem(), system);
  });

  describe('#setSystem()', function() {
    const firstSystem = new FileSystem();
    const binding = new Binding(firstSystem);
    assert.equal(binding.getSystem(), firstSystem);

    binding.setSystem(system);
    assert.equal(binding.getSystem(), system);
  });

  describe('#stat()', function() {
    it('calls callback with a Stats instance', function(done) {
      const binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), false, function(
        err,
        stats
      ) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(stats, Float64Array);
        done();
      });
    });

    it('returns a Stats instance when called synchronously', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'one.txt'), false);
      assert.instanceOf(stats, Float64Array);
    });

    it('identifies files (async)', function(done) {
      const binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), false, function(
        err,
        stats
      ) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
        done();
      });
    });

    it('identifies files (sync)', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'one.txt'), false);
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
    });

    it('identifies directories (async)', function(done) {
      const binding = new Binding(system);
      binding.stat('mock-dir', false, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[1] & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('identifies directories (sync)', function() {
      const binding = new Binding(system);
      const stats = binding.stat('mock-dir', false);
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFDIR);
    });

    it('includes atime, ctime, mtime and birthtime', function(done) {
      const binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), false, function(
        err,
        stats
      ) {
        if (err) {
          return done(err);
        }
        assert.equal(
          stats[10] * 1000 + stats[11] / 1000000,
          new Date(1).getTime()
        );
        assert.equal(
          stats[12] * 1000 + stats[13] / 1000000,
          new Date(3).getTime()
        );
        assert.equal(
          stats[14] * 1000 + stats[15] / 1000000,
          new Date(2).getTime()
        );
        assert.equal(
          stats[16] * 1000 + stats[17] / 1000000,
          new Date(4).getTime()
        );
        done();
      });
    });

    it('includes mode with file permissions (default)', function(done) {
      const binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), false, function(
        err,
        stats
      ) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[1] & parseInt('0777', 8), parseInt('0666', 8));
        done();
      });
    });

    it('includes mode with file permissions (custom)', function(done) {
      const binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), false, function(
        err,
        stats
      ) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[1] & parseInt('0777', 8), parseInt('0644', 8));
        done();
      });
    });

    it('includes size in bytes (async)', function(done) {
      const binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), false, function(
        err,
        stats
      ) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[8], 11);
        done();
      });
    });

    it('includes size in bytes (sync)', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'three.bin'), false);
      assert.equal(stats[8], 3);
    });

    it('includes non-zero size for directories', function() {
      const binding = new Binding(system);
      const stats = binding.stat('mock-dir', false);
      assert.isNumber(stats[8]);
      assert.isTrue(stats[8] > 0);
    });

    it('includes uid for files', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'two.txt'), false);
      if (process.getuid) {
        assert.equal(stats[3], process.getuid());
      }
    });

    it('includes uid for directories', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'empty'), false);
      if (process.getuid) {
        assert.equal(stats[3], process.getuid());
      }
    });

    it('includes gid for files', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'two.txt'), false);
      if (process.getgid) {
        assert.equal(stats[4], process.getgid());
      }
    });

    it('includes gid for directories', function() {
      const binding = new Binding(system);
      const stats = binding.stat(path.join('mock-dir', 'empty'), false);
      if (process.getgid) {
        assert.equal(stats[4], process.getgid());
      }
    });

    it('retrieves stats of files relative to symbolic linked directories', function() {
      const binding = new Binding(system);
      const stats = binding.stat(
        path.join('mock-dir', 'dir-link', 'a.txt'),
        false
      );
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats[1] & 0x1ff, parseInt('0644', 8));
      if (process.getuid) {
        assert.equal(stats[3], process.getuid());
      }
      if (process.getgid) {
        assert.equal(stats[4], process.getgid());
      }
    });
  });

  describe('#realpath()', function() {
    it('returns the real path for a regular file', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/one.txt', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('returns the real path for a directory', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/empty', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/empty'));
        done();
      });
    });

    it('returns the real path for a symlinked file', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/one-link.txt', 'utf-8', function(
        err,
        realPath
      ) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('returns the real path for a deeply symlinked file', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/one-link2.txt', 'utf-8', function(
        err,
        realPath
      ) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('returns the real path for a symlinked directory', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/dir-link', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/non-empty'));
        done();
      });
    });

    it('returns the real path for a deeply symlinked directory', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/dir-link2', 'utf-8', function(err, realPath) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/non-empty'));
        done();
      });
    });

    it('returns the real path for a file in a symlinked directory', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/dir-link/b.txt', 'utf-8', function(
        err,
        realPath
      ) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/non-empty/b.txt'));
        done();
      });
    });

    it('accepts a buffer', function(done) {
      const binding = new Binding(system);
      binding.realpath(bufferFrom('mock-dir/one.txt'), 'utf-8', function(
        err,
        realPath
      ) {
        if (err) {
          return done(err);
        }
        assertEqualPaths(realPath, path.resolve('mock-dir/one.txt'));
        done();
      });
    });

    it('can return a buffer', function(done) {
      const binding = new Binding(system);
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
      const binding = new Binding(system);
      binding.realpath('mock-dir/bogus-path', 'utf-8', function(err, realPath) {
        if (!err || realPath) {
          return done(new Error('Expected ENOENT'));
        }
        assert.equal(err.code, 'ENOENT');
        done();
      });
    });

    it('throws ENOTDIR for a file treated like a directory', function(done) {
      const binding = new Binding(system);
      binding.realpath('mock-dir/one.txt/foo', 'utf-8', function(
        err,
        realPath
      ) {
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
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      binding.fstat(fd, false, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(stats, Float64Array);
        done();
      });
    });

    it('returns a Stats instance when called synchronously', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      const stats = binding.fstat(fd, false);
      assert.instanceOf(stats, Float64Array);
    });

    it('identifies files (async)', function(done) {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      binding.fstat(fd, false, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
        done();
      });
    });

    it('identifies directories (async)', function(done) {
      const binding = new Binding(system);
      const fd = binding.open('mock-dir', flags('r'));
      binding.fstat(fd, false, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[1] & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('includes size in bytes (async)', function(done) {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      binding.fstat(fd, false, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats[8], 11);
        done();
      });
    });

    it('includes size in bytes (sync)', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'three.bin'), flags('r'));
      const stats = binding.fstat(fd, false);
      assert.equal(stats[8], 3);
    });

    it('includes non-zero size for directories', function() {
      const binding = new Binding(system);
      const fd = binding.open('mock-dir', flags('r'));
      const stats = binding.fstat(fd, false);
      assert.isNumber(stats[8]);
      assert.isTrue(stats[8] > 0);
    });
  });

  describe('#readdir()', function() {
    it('calls callback with file list', function(done) {
      const binding = new Binding(system);
      binding.readdir('mock-dir', 'utf8', false, function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(items.sort(), [
          'dead-link',
          'dir-link',
          'dir-link2',
          'empty',
          'non-empty',
          'one-link.txt',
          'one-link2.txt',
          'one.txt',
          'three.bin',
          'two.txt'
        ]);
        done();
      });
    });

    it('accepts "buffer" encoding', function(done) {
      const binding = new Binding(system);
      binding.readdir('mock-dir', 'buffer', false, function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        items.forEach(function(item) {
          assert.equal(Buffer.isBuffer(item), true);
        });
        const strings = items.map(function(item) {
          return item.toString();
        });
        assert.deepEqual(strings.sort(), [
          'dead-link',
          'dir-link',
          'dir-link2',
          'empty',
          'non-empty',
          'one-link.txt',
          'one-link2.txt',
          'one.txt',
          'three.bin',
          'two.txt'
        ]);
        done();
      });
    });

    it('returns a file list (sync)', function() {
      const binding = new Binding(system);
      const items = binding.readdir('mock-dir', 'utf8', false);
      assert.isArray(items);
      assert.deepEqual(items.sort(), [
        'dead-link',
        'dir-link',
        'dir-link2',
        'empty',
        'non-empty',
        'one-link.txt',
        'one-link2.txt',
        'one.txt',
        'three.bin',
        'two.txt'
      ]);
    });

    it('calls callback with file list for symbolic linked dir', function(done) {
      const binding = new Binding(system);
      binding.readdir(
        path.join('mock-dir', 'dir-link'),
        'utf8',
        false,
        function(err, items) {
          assert.isNull(err);
          assert.isArray(items);
          assert.deepEqual(items.sort(), ['a.txt', 'b.txt']);
          done();
        }
      );
    });

    it('calls callback with file list for link to symbolic linked dir', function(done) {
      const binding = new Binding(system);
      binding.readdir(
        path.join('mock-dir', 'dir-link2'),
        'utf8',
        false,
        function(err, items) {
          assert.isNull(err);
          assert.isArray(items);
          assert.deepEqual(items.sort(), ['a.txt', 'b.txt']);
          done();
        }
      );
    });

    it('calls callback with file list for symbolic linked dir (sync)', function() {
      const binding = new Binding(system);
      const items = binding.readdir(
        path.join('mock-dir', 'dir-link'),
        'utf8',
        false
      );
      assert.isArray(items);
      assert.deepEqual(items.sort(), ['a.txt', 'b.txt']);
    });

    it('calls callback with error for bogus dir', function(done) {
      const binding = new Binding(system);
      binding.readdir('bogus', 'utf8', false, function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

    it('calls callback with error for file path', function(done) {
      const binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'one.txt'), 'utf8', false, function(
        err,
        items
      ) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

    it('calls callback with error for dead symbolic link', function(done) {
      const binding = new Binding(system);
      binding.readdir(
        path.join('mock-dir', 'dead-link'),
        'utf8',
        false,
        function(err, items) {
          assert.instanceOf(err, Error);
          assert.isUndefined(items);
          done();
        }
      );
    });

    it('calls callback with error for symbolic link to file', function(done) {
      const binding = new Binding(system);
      binding.readdir(
        path.join('mock-dir', 'one-link.txt'),
        'utf8',
        false,
        function(err, items) {
          assert.instanceOf(err, Error);
          assert.isUndefined(items);
          done();
        }
      );
    });

    it('calls callback with error for link to symbolic link to file', function(done) {
      const binding = new Binding(system);
      binding.readdir(
        path.join('mock-dir', 'one-link2.txt'),
        'utf8',
        false,
        function(err, items) {
          assert.instanceOf(err, Error);
          assert.isUndefined(items);
          done();
        }
      );
    });
  });

  describe('#open()', function() {
    it('creates a file descriptor for reading (r)', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (r)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('r'));
      });
    });

    it('creates a file descriptor for reading and writing (r+)', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r+'));
      assert.isNumber(fd);
    });

    it('does not truncate (r+)', function() {
      const binding = new Binding(system);
      binding.open(path.join('mock-dir', 'two.txt'), flags('r+'));
      const file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'two content');
    });

    it('generates error if file does not exist (r+)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('r+'));
      });
    });

    it('creates a file descriptor for reading (rs)', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('rs'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (rs)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('rs'));
      });
    });

    it('creates a file descriptor for reading and writing (rs+)', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('rs+'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (rs+)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('rs+'));
      });
    });

    it('opens a new file for writing (w)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('w'), parseInt('0644', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0644', 8));
    });

    it('truncates an existing file for writing (w)', function() {
      const binding = new Binding(system);
      binding.open(
        path.join('mock-dir', 'two.txt'),
        flags('w'),
        parseInt('0666', 8)
      );
      const file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file is directory (w)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open('mock-dir', flags('w'));
      });
    });

    it('generates error if file exists (wx)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'two.txt'), flags('wx'));
      });
    });

    it('opens a new file for reading and writing (w+)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('w+'), parseInt('0644', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0644', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('truncates an existing file for writing (w+)', function() {
      const binding = new Binding(system);
      binding.open(
        path.join('mock-dir', 'one.txt'),
        flags('w+'),
        parseInt('0666', 8)
      );
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), '');
    });

    it('opens a new file for reading and writing (wx+)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('wx+'), parseInt('0644', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0644', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (wx+)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open(
          path.join('mock-dir', 'one.txt'),
          flags('wx+'),
          parseInt('0666', 8)
        );
      });
    });

    it('opens a new file for appending (a)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('a'), parseInt('0666', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0666', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending (a)', function() {
      const binding = new Binding(system);
      binding.open(
        path.join('mock-dir', 'one.txt'),
        flags('a'),
        parseInt('0666', 8)
      );
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'one content');
    });

    it('generates error if file is directory (a)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open('mock-dir', flags('a'));
      });
    });

    it('opens a new file for appending (ax)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('ax'), parseInt('0664', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0664', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (ax)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open(
          path.join('mock-dir', 'one.txt'),
          flags('ax'),
          parseInt('0666', 8)
        );
      });
    });

    it('opens a new file for appending and reading (a+)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('a+'), parseInt('0666', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0666', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending and reading (a+)', function() {
      const binding = new Binding(system);
      binding.open(
        path.join('mock-dir', 'one.txt'),
        flags('a+'),
        parseInt('0666', 8)
      );
      const file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'two content');
    });

    it('opens a new file for appending and reading (ax+)', function() {
      const binding = new Binding(system);
      binding.open('new.txt', flags('ax+'), parseInt('0666', 8));
      const file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), parseInt('0666', 8));
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending and reading (ax+)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open(
          path.join('mock-dir', 'two.txt'),
          flags('ax+'),
          parseInt('0666', 8)
        );
      });
    });
  });

  describe('#close()', function() {
    it('closes an existing file descriptor', function() {
      const binding = new Binding(system);
      const fd = binding.open('new.txt', flags('w'), parseInt('0644', 8));
      binding.close(fd);
    });

    it('fails for closed file descriptor', function() {
      const binding = new Binding(system);
      const fd = binding.open('new.txt', flags('w'), parseInt('0644', 8));
      binding.close(fd);
      assert.throws(function() {
        binding.close(fd);
      });
    });
  });

  describe('#read()', function() {
    it('reads from a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      const buffer = bufferAlloc(11);
      const read = binding.read(fd, buffer, 0, 11, 0);
      assert.equal(read, 11);
      assert.equal(String(buffer), 'two content');
    });

    it('reads into a Uint8Array', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'three.bin'), flags('r'));
      const buffer = new Uint8Array(3);
      const read = binding.read(fd, buffer, 0, 3, 0);
      assert.equal(read, 3);
      assert.deepEqual(Array.from(buffer), [1, 2, 3]);
    });

    it('interprets null position as current position', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      const buffer = bufferAlloc(4);

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
      const binding = new Binding(system);
      const fd = binding.open(
        path.join('mock-dir', 'one-link.txt'),
        flags('r')
      );
      const buffer = bufferAlloc(11);
      const read = binding.read(fd, buffer, 0, 11, 0);
      assert.equal(read, 11);
      assert.equal(String(buffer), 'one content');
    });

    it('reads from a deeply linked symlink', function() {
      const binding = new Binding(system);
      const fd = binding.open(
        path.join('mock-dir', 'one-link2.txt'),
        flags('r')
      );
      const buffer = bufferAlloc(11);
      const read = binding.read(fd, buffer, 0, 11, 0);
      assert.equal(read, 11);
      assert.equal(String(buffer), 'one content');
    });

    it('throws if not open for reading', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('w'));
      const buffer = bufferAlloc(11);
      assert.throws(function() {
        binding.read(fd, buffer, 0, 11, 0);
      });
    });

    it('throws ENOTDIR when trying to open an incorrect path (nested under existing file)', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.open(
          path.join('mock-dir', 'two.txt', 'bogus-path'),
          flags('r')
        );
      }, 'ENOTDIR');
    });
  });

  describe('#write()', function() {
    it('writes to a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'new.txt'), flags('w'));
      const buffer = bufferFrom('new content');
      const written = binding.write(fd, buffer, 0, 11, 0);
      assert.equal(written, 11);
      const file = system.getItem(path.join('mock-dir', 'new.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('can take input from a Uint8Array', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'new.txt'), flags('w'));
      const buffer = Uint8Array.from([1, 2, 3, 4, 5]);
      const written = binding.write(fd, buffer, 0, 5, 0);
      assert.equal(written, 5);
      const file = system.getItem(path.join('mock-dir', 'new.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.deepEqual(Array.from(content), [1, 2, 3, 4, 5]);
    });

    it('can overwrite a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('w'));
      const buffer = bufferFrom('bingo');
      const written = binding.write(fd, buffer, 0, 5, null);
      assert.equal(written, 5);
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'bingo');
    });

    it('can append to a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      const buffer = bufferFrom(' more');
      const written = binding.write(fd, buffer, 0, 5, null);
      assert.equal(written, 5);
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'one content more');
    });

    it('can overwrite part of a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      const buffer = bufferFrom('new');
      const written = binding.write(fd, buffer, 0, 3, 0);
      assert.equal(written, 3);
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('throws if not open for writing', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      const buffer = bufferFrom('some content');
      assert.throws(function() {
        binding.write(fd, buffer, 0, 12, 0);
      });
    });
  });

  describe('#writeBuffers()', function() {
    it('writes to a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'new.txt'), flags('w'));
      const buffers = [bufferFrom('new '), bufferFrom('content')];
      const written = binding.writeBuffers(fd, buffers);
      assert.equal(written, 11);
      const file = system.getItem(path.join('mock-dir', 'new.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('can append to a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      const buffers = [bufferFrom(' more'), bufferFrom(' content')];
      const written = binding.writeBuffers(fd, buffers);
      assert.equal(written, 13);
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'one content more content');
    });

    it('can overwrite part of a file', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      const buffers = [bufferFrom('n'), bufferFrom('e'), bufferFrom('w')];
      const written = binding.writeBuffers(fd, buffers, 0);
      assert.equal(written, 3);
      const file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      const content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('throws if not open for writing', function() {
      const binding = new Binding(system);
      const fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      const buffers = [bufferFrom('some content')];
      assert.throws(function() {
        binding.writeBuffers(fd, buffers);
      });
    });
  });

  describe('#rename()', function() {
    it('allows files to be renamed', function(done) {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'one.txt');
      const newPath = path.join('mock-dir', 'empty', 'new.txt');
      binding.rename(oldPath, newPath, function(_) {
        const stats = binding.stat(newPath);
        assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
        assert.equal(stats[8], 11);
        done();
      });
    });

    it('allows files to be renamed (sync)', function() {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'one.txt');
      const newPath = path.join('mock-dir', 'new.txt');
      binding.rename(oldPath, newPath);
      const stats = binding.stat(newPath);
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats[8], 11);
    });

    it('replaces existing files (sync)', function() {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'one.txt');
      const newPath = path.join('mock-dir', 'two.txt');
      binding.rename(oldPath, newPath);
      const stats = binding.stat(newPath);
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats[8], 11);
    });

    it('allows directories to be renamed', function(done) {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'empty');
      const newPath = path.join('mock-dir', 'new');
      binding.rename(oldPath, newPath, function(_) {
        const stats = binding.stat(newPath);
        assert.equal(stats[1] & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('allows directories to be renamed (sync)', function() {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir');
      const newPath = path.join('new-dir');
      binding.rename(oldPath, newPath);
      const stats = binding.stat(newPath);
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFDIR);
      const items = binding.readdir(newPath);
      assert.isArray(items);
      assert.deepEqual(items.sort(), [
        'dead-link',
        'dir-link',
        'dir-link2',
        'empty',
        'non-empty',
        'one-link.txt',
        'one-link2.txt',
        'one.txt',
        'three.bin',
        'two.txt'
      ]);
    });

    it('calls callback with error for bogus old path', function(done) {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'bogus');
      const newPath = path.join('mock-dir', 'new');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

    it('calls callback with error for file->dir rename', function(done) {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'one.txt');
      const newPath = path.join('mock-dir', 'empty');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

    it('calls callback with error for dir->file rename', function(done) {
      const binding = new Binding(system);
      const oldPath = path.join('mock-dir', 'one.txt');
      const newPath = path.join('mock-dir', 'empty');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });
  });

  describe('#mkdir()', function() {
    it('creates a new directory', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'foo');
      binding.mkdir(dirPath, parseInt('0755', 8), false);
      const dir = system.getItem(dirPath);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), parseInt('0755', 8));
    });

    it('fails if parent does not exist', function() {
      const binding = new Binding(system);
      const dirPath = path.join('bogus', 'path');
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8), false);
      });
    });

    it('fails if directory exists', function() {
      const binding = new Binding(system);
      const dirPath = 'mock-dir';
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8), false);
      });
    });

    it('fails if file exists', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'one.txt');
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8), false);
      });
    });
  });

  describe('#mkdir() recursive', function() {
    it('creates a new directory', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'foo');
      binding.mkdir(dirPath, parseInt('0755', 8), true);
      const dir = system.getItem(dirPath);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), parseInt('0755', 8));
    });

    it('creates a new deep directory', function() {
      const binding = new Binding(system);
      const dirPath1 = path.join('mock-dir', 'foo');
      const dirPath2 = path.join(dirPath1, 'bar');
      const dirPath3 = path.join(dirPath2, 'loo');
      binding.mkdir(dirPath3, parseInt('0755', 8), true);

      let dir = system.getItem(dirPath3);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), parseInt('0755', 8));

      dir = system.getItem(dirPath2);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), parseInt('0755', 8));

      dir = system.getItem(dirPath1);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), parseInt('0755', 8));
    });

    it('fails if permission does not allow recursive creation', function() {
      const binding = new Binding(system);
      const dirPath1 = path.join('mock-dir', 'foo');
      const dirPath2 = path.join(dirPath1, 'bar');
      const dirPath3 = path.join(dirPath2, 'loo');
      assert.throws(function() {
        binding.mkdir(dirPath3, parseInt('0400', 8), true);
      });
    });

    it('fails if one parent is not a folder', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'one.txt', 'foo', 'bar');
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8), true);
      });
    });

    it('fails if file exists', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'non-empty', 'a.txt');
      assert.throws(function() {
        binding.mkdir(dirPath, parseInt('0755', 8), true);
      });
    });

    it('passes silently if directory exists', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'non-empty');
      assert.doesNotThrow(function() {
        binding.mkdir(dirPath, parseInt('0755', 8), true);
      });
    });
  });

  describe('#mkdtemp()', function() {
    it('creates a new directory', function() {
      const binding = new Binding(system);
      const template = path.join('mock-dir', 'fooXXXXXX');
      const dirPath = binding.mkdtemp(template);
      assert.notEqual(template, dirPath);
      const dir = system.getItem(dirPath);
      assert.instanceOf(dir, Directory);
    });

    it('fails if parent does not exist', function() {
      const binding = new Binding(system);
      const dirPath = path.join('bogus', 'pathXXXXXX');
      assert.throws(function() {
        binding.mkdtemp(dirPath);
      });
    });

    it('fails if file exists', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'one.txt', 'XXXXXX');
      assert.throws(function() {
        binding.mkdtemp(dirPath);
      });
    });
  });

  describe('#rmdir()', function() {
    it('removes an empty directory', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'empty');
      binding.rmdir(dirPath);
      assert.isNull(system.getItem(dirPath));
    });

    it('fails if directory is not empty', function() {
      const binding = new Binding(system);
      const dirPath = 'mock-dir';
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

    it('fails if directory does not exist', function() {
      const binding = new Binding(system);
      const dirPath = path.join('bogus', 'path');
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

    it('fails if a file exists', function() {
      const binding = new Binding(system);
      const dirPath = path.join('mock-dir', 'one.txt');
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });
  });

  describe('#ftruncate()', function() {
    it('truncates a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r+'));
      binding.ftruncate(fd, 3);
      const file = system.getItem(pathname);
      assert.equal(String(file.getContent()), 'one');
    });

    it('fails if directory', function() {
      const binding = new Binding(system);
      const fd = binding.open('mock-dir', flags('r'));
      assert.throws(function() {
        binding.ftruncate(fd, 3);
      });
    });

    it('fails if not open for writing', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      assert.throws(function() {
        binding.ftruncate(fd, 4);
      });
    });
  });

  describe('#chown()', function() {
    it('sets the uid and gid for a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      binding.chown(pathname, 3, 4);
      const file = system.getItem(pathname);
      assert.equal(file.getUid(), 3);
      assert.equal(file.getGid(), 4);
    });

    it('sets the uid and gid for a directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      binding.chown(pathname, 5, 6);
      const dir = system.getItem(pathname);
      assert.equal(dir.getUid(), 5);
      assert.equal(dir.getGid(), 6);
    });
  });

  describe('#fchown()', function() {
    it('sets the uid and gid for a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.fchown(fd, 3, 4);
      const file = system.getItem(pathname);
      assert.equal(file.getUid(), 3);
      assert.equal(file.getGid(), 4);
    });

    it('sets the uid and gid for a directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      const fd = binding.open(pathname, flags('r'));
      binding.fchown(fd, 5, 6);
      const dir = system.getItem(pathname);
      assert.equal(dir.getUid(), 5);
      assert.equal(dir.getGid(), 6);
    });
  });

  describe('#chmod()', function() {
    it('sets the mode for a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'two.txt');
      binding.chmod(pathname, parseInt('0644', 8));
      const file = system.getItem(pathname);
      assert.equal(file.getMode(), parseInt('0644', 8));
    });

    it('sets the mode for a directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      binding.chmod(pathname, parseInt('0755', 8));
      const dir = system.getItem(pathname);
      assert.equal(dir.getMode(), parseInt('0755', 8));
    });
  });

  describe('#fchmod()', function() {
    it('sets the mode for a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.fchmod(fd, parseInt('0664', 8));
      const file = system.getItem(pathname);
      assert.equal(file.getMode(), parseInt('0664', 8));
    });

    it('sets the mode for a directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      const fd = binding.open(pathname, flags('r'));
      binding.fchmod(fd, parseInt('0775', 8));
      const dir = system.getItem(pathname);
      assert.equal(dir.getMode(), parseInt('0775', 8));
    });
  });

  describe('#unlink()', function() {
    it('deletes a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      binding.unlink(pathname);
      assert.isNull(system.getItem(pathname));
    });

    it('fails for directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      assert.throws(function() {
        binding.unlink(pathname);
      });
    });

    it('fails for bogus path', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'bogus.txt');
      assert.throws(function() {
        binding.unlink(pathname);
      });
    });
  });

  describe('#utimes()', function() {
    it('updates atime and mtime for a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      binding.utimes(pathname, 100, 200);
      const item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 100 * 1000);
      assert.equal(item.getMTime().getTime(), 200 * 1000);
    });

    it('updates atime and mtime for a directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      binding.utimes(pathname, 300, 400);
      const item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 300 * 1000);
      assert.equal(item.getMTime().getTime(), 400 * 1000);
    });

    it('fails for a bogus path', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'bogus.txt');
      assert.throws(function() {
        binding.utimes(pathname, 300, 400);
      });
    });
  });

  describe('#futimes()', function() {
    it('updates atime and mtime for a file', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.futimes(fd, 100, 200);
      const item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 100 * 1000);
      assert.equal(item.getMTime().getTime(), 200 * 1000);
    });

    it('updates atime and mtime for a directory', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'empty');
      const fd = binding.open(pathname, flags('r'));
      binding.futimes(fd, 300, 400);
      const item = system.getItem(pathname);
      assert.equal(item.getATime().getTime(), 300 * 1000);
      assert.equal(item.getMTime().getTime(), 400 * 1000);
    });
  });

  describe('#fsync()', function() {
    it('synchronize file state (noop)', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.fsync(fd);
    });

    it('fails for closed file descriptor', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.close(fd);
      assert.throws(function() {
        binding.fsync(fd);
      });
    });
  });

  describe('#fdatasync()', function() {
    it('synchronize file state (noop)', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.fdatasync(fd);
    });

    it('fails for closed file descriptor', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one.txt');
      const fd = binding.open(pathname, flags('r'));
      binding.close(fd);
      assert.throws(function() {
        binding.fdatasync(fd);
      });
    });
  });

  describe('#link()', function() {
    it('creates a link to a file', function() {
      const binding = new Binding(system);
      const source = path.join('mock-dir', 'one.txt');
      const dest = path.join('mock-dir', 'link.txt');
      binding.link(source, dest);
      const link = system.getItem(dest);
      assert.instanceOf(link, File);
      assert.equal(String(link.getContent()), 'one content');
    });

    it('fails if dest exists', function() {
      const binding = new Binding(system);
      const source = path.join('mock-dir', 'one.txt');
      const dest = path.join('mock-dir', 'two.txt');
      assert.throws(function() {
        binding.link(source, dest);
      });
    });

    it('fails if source is directory', function() {
      const binding = new Binding(system);
      const source = path.join('mock-dir', 'empty');
      const dest = path.join('mock-dir', 'link');
      assert.throws(function() {
        binding.link(source, dest);
      });
    });
  });

  describe('#symlink()', function() {
    it('creates a symbolic link to a file', function() {
      const binding = new Binding(system);
      const source = path.join('.', 'one.txt');
      const dest = path.join('mock-dir', 'link.txt');
      binding.symlink(source, dest);
      const link = system.getItem(dest);
      assert.instanceOf(link, SymbolicLink);
      assert.equal(link.getPath(), source);
    });

    it('fails if dest exists', function() {
      const binding = new Binding(system);
      const source = path.join('.', 'one.txt');
      const dest = path.join('mock-dir', 'two.txt');
      assert.throws(function() {
        binding.symlink(source, dest);
      });
    });

    it('works if source is directory', function() {
      const binding = new Binding(system);
      const source = path.join('mock-dir', 'empty');
      const dest = path.join('mock-dir', 'link');
      binding.symlink(source, dest);
      const link = system.getItem(dest);
      assert.instanceOf(link, SymbolicLink);
      assert.equal(link.getPath(), source);
    });
  });

  describe('#readlink()', function() {
    it('reads the symbolic link', function() {
      const binding = new Binding(system);
      const srcPath = binding.readlink(path.join('mock-dir', 'one-link.txt'));
      assert.equal(srcPath, './one.txt');
    });

    it('can return "buffer" encoding', function() {
      const binding = new Binding(system);
      const srcPath = binding.readlink(
        path.join('mock-dir', 'one-link.txt'),
        'buffer'
      );
      assert.equal(Buffer.isBuffer(srcPath), true);
      assert.equal(srcPath.toString(), './one.txt');
    });

    it('fails for regular files', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.readlink(path.join('mock-dir', 'one.txt'));
      }, /EINVAL/);
    });

    it('fails for directories', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.readlink(path.join('mock-dir', 'empty'));
      }, /EINVAL/);
    });

    it('fails for bogus paths', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.readlink(path.join('mock-dir', 'bogus'));
      }, /ENOENT/);
    });
  });

  describe('#lstat()', function() {
    it('stats symbolic links', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one-link.txt');
      const stats = binding.lstat(pathname, false);
      assert.equal(stats[1] & constants.S_IFMT, constants.S_IFLNK);
      assert.equal(stats[8], binding.readlink(pathname).length);
    });
  });

  describe('#access()', function() {
    it('works if file exists', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'one-link.txt');
      binding.access(pathname);
    });

    it('throws for dead link', function() {
      const binding = new Binding(system);
      const pathname = path.join('mock-dir', 'dead-link.txt');
      assert.throws(function() {
        binding.access(pathname);
      }, /ENOENT/);
    });

    if (process.getuid && process.getgid) {
      it('fails in case of insufficient user permissions', function() {
        const binding = new Binding(system);
        const item = system.getItem(path.join('mock-dir', 'one.txt'));
        item.setMode(parseInt('0077', 8));
        assert.throws(function() {
          binding.access(path.join('mock-dir', 'one.txt'), 1);
        }, /EACCES/);
      });

      it('fails in case of insufficient group permissions', function() {
        const binding = new Binding(system);
        const item = system.getItem(path.join('mock-dir', 'one.txt'));
        item.setUid(process.getuid() + 1);
        item.setMode(parseInt('0707', 8));
        assert.throws(function() {
          binding.access(path.join('mock-dir', 'one.txt'), 2);
        }, /EACCES/);
      });

      it('fails in case of insufficient permissions', function() {
        const binding = new Binding(system);
        const item = system.getItem(path.join('mock-dir', 'one.txt'));
        item.setUid(process.getuid() + 1);
        item.setGid(process.getgid() + 1);
        item.setMode(parseInt('0771', 8));
        assert.throws(function() {
          binding.access(path.join('mock-dir', 'one.txt'), 5);
        }, /EACCES/);
      });
    }

    it('fails for bogus paths', function() {
      const binding = new Binding(system);
      assert.throws(function() {
        binding.access(path.join('mock-dir', 'bogus'));
      }, /ENOENT/);
    });
  });
});
