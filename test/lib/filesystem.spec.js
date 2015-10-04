/* eslint-env mocha */
'use strict';

var path = require('path');

var Directory = require('../../lib/directory');
var File = require('../../lib/file');
var FileSystem = require('../../lib/filesystem');
var assert = require('../helper').assert;


describe('FileSystem', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var system = new FileSystem();
      assert.instanceOf(system, FileSystem);
    });

  });

  describe('#getItem()', function() {

    it('gets an item', function() {
      var system = FileSystem.create({
        'one/two/three.js': 'contents'
      });

      var filepath = path.join('one', 'two', 'three.js');
      var item = system.getItem(filepath);
      assert.instanceOf(item, File);
    });

    it('returns null if not found', function() {
      var system = FileSystem.create({
        'one/two/three.js': 'contents'
      });

      assert.isNull(
          system.getItem(path.join('one', 'two', 'four.js')));
      assert.isNull(
          system.getItem(path.join('one', '2', 'three.js')));
      assert.isNull(
          system.getItem(path.join('um', 'two', 'three.js')));

    });

    it('gets an item traversing links to symbolic links', function() {
      var system = FileSystem.create({
        'dir-link': FileSystem.symlink({path: './b/dir-link2'}),
        'b': {
          'dir-link2': FileSystem.symlink({path: './c/dir'}),
          'c': {
            dir: {
              'a': 'file a',
              'b': {
                'c': 'file c',
                'd': 'file d'
              }
            }
          }
        }
      });
      var file = system.getItem(path.join('dir-link', 'a'));
      assert.instanceOf(file, File);

      var dir = system.getItem(path.join('dir-link', 'b'));
      assert.instanceOf(dir, Directory);
      assert.deepEqual(dir.list().sort(), ['c', 'd']);
    });

  });

});

describe('FileSystem.file', function() {

  it('creates a factory for files', function() {
    var factory = FileSystem.file();
    assert.isFunction(factory);

    var file = factory();
    assert.instanceOf(file, File);
  });

  it('accepts a content member', function() {
    var factory = FileSystem.file({content: 'foo'});
    assert.isFunction(factory);

    var file = factory();
    assert.instanceOf(file, File);
    var content = file.getContent();
    assert.isTrue(Buffer.isBuffer(content));
    assert.equal(String(content), 'foo');
  });

});


describe('FileSystem.directory', function() {

  it('creates a factory for directories', function() {
    var factory = FileSystem.directory();
    assert.isFunction(factory);

    var dir = factory();
    assert.instanceOf(dir, Directory);
  });

});


describe('FileSystem.create', function() {

  it('provides a convenient way to populate a file system', function() {

    var system = FileSystem.create({
      'path/to/one': {
        'file.js': 'file.js content',
        'dir': {}
      },
      'path/to/two.js': 'two.js content',
      'path/to/three': {}
    });

    assert.instanceOf(system, FileSystem);

    var filepath, item;

    // confirm 'path/to/one' directory was created
    filepath = path.join('path', 'to', 'one');
    item = system.getItem(filepath);
    assert.instanceOf(item, Directory);
    assert.deepEqual(item.list().sort(), ['dir', 'file.js']);

    // confirm 'path/to/one/file.js' file was created
    filepath = path.join('path', 'to', 'one', 'file.js');
    item = system.getItem(filepath);
    assert.instanceOf(item, File);
    assert.equal(String(item.getContent()), 'file.js content');

    // confirm 'path/to/one/dir' directory was created
    filepath = path.join('path', 'to', 'one', 'dir');
    item = system.getItem(filepath);
    assert.instanceOf(item, Directory);
    assert.deepEqual(item.list(), []);

    // confirm 'path/to/two.js' file was created
    filepath = path.join('path', 'to', 'two.js');
    item = system.getItem(filepath);
    assert.instanceOf(item, File);
    assert.equal(String(item.getContent()), 'two.js content');

    // confirm 'path/to/three' directory was created
    filepath = path.join('path', 'to', 'three');
    item = system.getItem(filepath);
    assert.instanceOf(item, Directory);
    assert.deepEqual(item.list(), []);

  });

  it('accepts file factory', function() {

    var system = FileSystem.create({
      'path/to/file.js': FileSystem.file({content: 'foo'})
    });

    assert.instanceOf(system, FileSystem);

    var file = system.getItem(path.join('path', 'to', 'file.js'));
    assert.instanceOf(file, File);
    assert.equal(String(file.getContent()), 'foo');

  });

  it('accepts file factory with uid & gid', function() {

    var system = FileSystem.create({
      'path/to/file.js': FileSystem.file({
        content: 'foo',
        uid: 42,
        gid: 43
      })
    });

    assert.instanceOf(system, FileSystem);

    var file = system.getItem(path.join('path', 'to', 'file.js'));
    assert.instanceOf(file, File);
    assert.equal(String(file.getContent()), 'foo');
    assert.equal(file.getUid(), 42);
    assert.equal(file.getGid(), 43);

  });

  it('accepts directory factory', function() {

    var system = FileSystem.create({
      'path/to/dir': FileSystem.directory()
    });

    assert.instanceOf(system, FileSystem);

    var dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);

  });

  it('accepts directory factory with uid & gid', function() {

    var system = FileSystem.create({
      'path/to/dir': FileSystem.directory({
        uid: 42,
        gid: 43
      })
    });

    assert.instanceOf(system, FileSystem);

    var dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);
    assert.equal(dir.getUid(), 42);
    assert.equal(dir.getGid(), 43);

  });

  it('accepts directory factory with additional items', function() {

    var system = FileSystem.create({
      'path/to/dir': FileSystem.directory({
        mode: parseInt('0755', 8),
        items: {
          'file.txt': 'file content',
          'empty-dir': {}
        }
      })
    });

    assert.instanceOf(system, FileSystem);

    var dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);
    assert.equal(dir.getMode(), parseInt('0755', 8));

    var file = system.getItem(path.join('path', 'to', 'dir', 'file.txt'));
    assert.instanceOf(file, File);
    assert.equal(String(file.getContent()), 'file content');

    var empty = system.getItem(path.join('path', 'to', 'dir', 'empty-dir'));
    assert.instanceOf(empty, Directory);
    assert.deepEqual(empty.list(), []);
  });

  it('correctly generates link counts', function() {

    var system = FileSystem.create({
      '/dir-a.0': {
        'dir-b.0': {
          'dir-c.0': {},
          'dir-c.1': {},
          'file-c.0': 'content',
          'file-c.1': 'content',
          'symlink-c.0': FileSystem.symlink({path: 'file-c.0'})
        }
      }
    });

    /**
     * 3 links: /dir-a.0, /dir-a.0/., and /dir-a.0/dir-b.0/..
     */
    assert.equal(system.getItem('/dir-a.0').links, 3);

    /**
     * 4 links: /dir-a.0/dir-b.0, /dir-a.0/dir-b.0/.,
     * /dir-a.0/dir-b.0/dir-c.0/.., and /dir-a.0/dir-b.0/dir-c.1/..
     */
    assert.equal(system.getItem('/dir-a.0/dir-b.0').links, 4);

    /**
     * 2 links: /dir-a.0/dir-b.0/dir-c.0 and /dir-a.0/dir-b.0/dir-c.0/.
     */
    assert.equal(system.getItem('/dir-a.0/dir-b.0/dir-c.0').links, 2);

    /**
     * 2 links: /dir-a.0/dir-b.0/dir-c.0 and /dir-a.0/dir-b.0/dir-c.0/.
     */
    assert.equal(system.getItem('/dir-a.0/dir-b.0/dir-c.0').links, 2);

    /**
     * 1 link: /dir-a.0/dir-b.0/file-c.0
     */
    assert.equal(system.getItem('/dir-a.0/dir-b.0/file-c.0').links, 1);

    /**
     * 1 link: /dir-a.0/dir-b.0/file-c.1
     */
    assert.equal(system.getItem('/dir-a.0/dir-b.0/file-c.1').links, 1);

    /**
     * 1 link: /dir-a.0/dir-b.0/symlink-c.0
     */
    assert.equal(system.getItem('/dir-a.0/dir-b.0/symlink-c.0').links, 1);

  });

});
