'use strict';

const tmpdir = require('temp-dir');
const path = require('path');

const Directory = require('../../lib/directory');
const File = require('../../lib/file');
const FileSystem = require('../../lib/filesystem');
const assert = require('../helper').assert;

describe('FileSystem', function() {
  describe('constructor', function() {
    it('creates a new instance', function() {
      const system = new FileSystem();
      assert.instanceOf(system, FileSystem);
    });

    it('accepts a createCwd option', function() {
      const cwd = process.cwd();
      const withCwd = new FileSystem({createCwd: true});
      const withoutCwd = new FileSystem({createCwd: false});

      assert.instanceOf(withCwd.getItem(cwd), Directory);
      assert.isNull(withoutCwd.getItem(cwd));
    });

    it('accepts a createTmp option', function() {
      const withTmp = new FileSystem({createTmp: true});
      const withoutTmp = new FileSystem({createTmp: false});

      assert.instanceOf(withTmp.getItem(tmpdir), Directory);
      assert.isNull(withoutTmp.getItem(tmpdir));
    });
  });

  describe('#getRoot()', function() {
    it('gets the root directory', function() {
      const system = new FileSystem();
      assert.instanceOf(system.getRoot(), Directory);
    });
  });

  describe('#getItem()', function() {
    it('gets an item', function() {
      const system = FileSystem.create({
        'one/two/three.js': 'contents'
      });

      const filepath = path.join('one', 'two', 'three.js');
      const item = system.getItem(filepath);
      assert.instanceOf(item, File);
    });

    it('returns null if not found', function() {
      const system = FileSystem.create({
        'one/two/three.js': 'contents'
      });

      assert.isNull(system.getItem(path.join('one', 'two', 'four.js')));
      assert.isNull(system.getItem(path.join('one', '2', 'three.js')));
      assert.isNull(system.getItem(path.join('um', 'two', 'three.js')));
    });

    it('gets an item traversing links to symbolic links', function() {
      const system = FileSystem.create({
        'dir-link': FileSystem.symlink({path: './b/dir-link2'}),
        b: {
          'dir-link2': FileSystem.symlink({path: './c/dir'}),
          c: {
            dir: {
              a: 'file a',
              b: {
                c: 'file c',
                d: 'file d'
              }
            }
          }
        }
      });
      const file = system.getItem(path.join('dir-link', 'a'));
      assert.instanceOf(file, File);

      const dir = system.getItem(path.join('dir-link', 'b'));
      assert.instanceOf(dir, Directory);
      assert.deepEqual(dir.list().sort(), ['c', 'd']);
    });
  });
});

describe('FileSystem.file', function() {
  it('creates a factory for files', function() {
    const factory = FileSystem.file();
    assert.isFunction(factory);

    const file = factory();
    assert.instanceOf(file, File);
  });

  it('accepts a content member', function() {
    const factory = FileSystem.file({content: 'foo'});
    assert.isFunction(factory);

    const file = factory();
    assert.instanceOf(file, File);
    const content = file.getContent();
    assert.isTrue(Buffer.isBuffer(content));
    assert.equal(String(content), 'foo');
  });
});

describe('FileSystem.directory', function() {
  it('creates a factory for directories', function() {
    const factory = FileSystem.directory();
    assert.isFunction(factory);

    const dir = factory();
    assert.instanceOf(dir, Directory);
  });
});

describe('FileSystem.create', function() {
  it('provides a convenient way to populate a file system', function() {
    const system = FileSystem.create({
      'path/to/one': {
        'file.js': 'file.js content',
        dir: {}
      },
      'path/to/two.js': 'two.js content',
      'path/to/three': {}
    });

    assert.instanceOf(system, FileSystem);

    let filepath, item;

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

  it('passes options to the FileSystem constructor', function() {
    const cwd = process.cwd();

    const withoutCwd = FileSystem.create({}, {createCwd: false});
    const withoutTmp = FileSystem.create({}, {createTmp: false});

    assert.isNull(withoutCwd.getItem(cwd));
    assert.instanceOf(withoutCwd.getItem(tmpdir), Directory);

    assert.isNull(withoutTmp.getItem(tmpdir));
    assert.instanceOf(withoutTmp.getItem(cwd), Directory);
  });

  it('accepts file factory', function() {
    const system = FileSystem.create({
      'path/to/file.js': FileSystem.file({content: 'foo'})
    });

    assert.instanceOf(system, FileSystem);

    const file = system.getItem(path.join('path', 'to', 'file.js'));
    assert.instanceOf(file, File);
    assert.equal(String(file.getContent()), 'foo');
  });

  it('accepts file factory with uid & gid', function() {
    const system = FileSystem.create({
      'path/to/file.js': FileSystem.file({
        content: 'foo',
        uid: 42,
        gid: 43
      })
    });

    assert.instanceOf(system, FileSystem);

    const file = system.getItem(path.join('path', 'to', 'file.js'));
    assert.instanceOf(file, File);
    assert.equal(String(file.getContent()), 'foo');
    assert.equal(file.getUid(), 42);
    assert.equal(file.getGid(), 43);
  });

  it('accepts directory factory', function() {
    const system = FileSystem.create({
      'path/to/dir': FileSystem.directory()
    });

    assert.instanceOf(system, FileSystem);

    const dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);
  });

  it('accepts directory factory with uid & gid', function() {
    const system = FileSystem.create({
      'path/to/dir': FileSystem.directory({
        uid: 42,
        gid: 43
      })
    });

    assert.instanceOf(system, FileSystem);

    const dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);
    assert.equal(dir.getUid(), 42);
    assert.equal(dir.getGid(), 43);
  });

  it('accepts directory factory with additional items', function() {
    const system = FileSystem.create({
      'path/to/dir': FileSystem.directory({
        mode: parseInt('0755', 8),
        items: {
          'file.txt': 'file content',
          'empty-dir': {}
        }
      })
    });

    assert.instanceOf(system, FileSystem);

    const dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);
    assert.equal(dir.getMode(), parseInt('0755', 8));

    const file = system.getItem(path.join('path', 'to', 'dir', 'file.txt'));
    assert.instanceOf(file, File);
    assert.equal(String(file.getContent()), 'file content');

    const empty = system.getItem(path.join('path', 'to', 'dir', 'empty-dir'));
    assert.instanceOf(empty, Directory);
    assert.deepEqual(empty.list(), []);
  });

  it('correctly generates link counts', function() {
    const system = FileSystem.create({
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

  it('throws if item content is not valid type', function() {
    assert.throws(function() {
      FileSystem.create({
        '/dir-a.0': {
          'dir-b.0': {
            'file-c.0': undefined
          }
        }
      });
    });

    assert.throws(function() {
      FileSystem.create({
        '/dir-a.0': {
          'dir-b.0': {
            'file-c.0': 123
          }
        }
      });
    });
  });
});
