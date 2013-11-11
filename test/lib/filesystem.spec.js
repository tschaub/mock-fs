var path = require('path');

var Directory = require('../../lib/directory').Directory;
var File = require('../../lib/file').File;
var mock = require('../../lib/filesystem');
var assert = require('../helper').assert;


describe('FileSystem', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var system = new mock.FileSystem();
      assert.instanceOf(system, mock.FileSystem);
    });

  });

  describe('#addRoot()', function() {

    it('adds a new root directory', function() {
      var system = new mock.FileSystem();
      var root = system.addRoot('');
      assert.instanceOf(root, Directory);
      assert.equal(root.getName(), '');
    });

  });

  describe('#getRoot()', function() {

    it('gets a named root directory', function() {
      var system = new mock.FileSystem();
      system.addRoot('C:\\');
      var root = system.getRoot('C:\\');
      assert.instanceOf(root, Directory);
      assert.equal(root.getName(), 'C:\\');
    });

  });

  describe('#getItem()', function() {

    it('gets an item', function() {
      var system = new mock.FileSystem();
      system.addRoot('')
          .addItem(new Directory('one'))
          .addItem(new Directory('two'))
          .addItem(new File('three.js'));

      var filepath = path.join(path.sep, 'one', 'two', 'three.js');
      var item = system.getItem(filepath);
      assert.instanceOf(item, File);
      assert.equal(item.getName(), 'three.js');
      assert.equal(item.getPath(), filepath);
    });

    it('returns null if not found', function() {
      var system = new mock.FileSystem();
      system.addRoot('')
          .addItem(new Directory('one'))
          .addItem(new Directory('two'))
          .addItem(new File('three.js'));

      assert.isNull(
          system.getItem(path.join(path.sep, 'one', 'two', 'four.js')));
      assert.isNull(
          system.getItem(path.join(path.sep, 'one', '2', 'three.js')));
      assert.isNull(
          system.getItem(path.join(path.sep, 'um', 'two', 'three.js')));
      assert.isNull(
          system.getItem(path.join('one', 'two', 'three.js')));

    });

  });

});

describe('file', function() {

  it('creates a factory for files', function() {
    var factory = mock.file();
    assert.isFunction(factory);

    var file = factory('foo');
    assert.instanceOf(file, File);
    assert.equal(file.getName(), 'foo');

    var another = factory('bar');
    assert.instanceOf(another, File);
    assert.equal(another.getName(), 'bar');
  });

  it('accepts a content member', function() {
    var factory = mock.file({content: 'foo'});
    assert.isFunction(factory);

    var file = factory('bar');
    assert.instanceOf(file, File);
    assert.equal(file.getName(), 'bar');
    var content = file.getContent();
    assert.isTrue(Buffer.isBuffer(content));
    assert.equal(String(content), 'foo');
  });

});


describe('directory', function() {

  it('creates a factory for directories', function() {
    var factory = mock.directory();
    assert.isFunction(factory);

    var dir = factory('foo');
    assert.instanceOf(dir, Directory);
    assert.equal(dir.getName(), 'foo');

    var another = factory('bar');
    assert.instanceOf(another, Directory);
    assert.equal(another.getName(), 'bar');
  });

});


describe('create', function() {

  it('provides a convenient way to populate a file system', function() {

    var system = mock.create({
      'path/to/one': {
        'file.js': 'file.js content',
        'dir': {}
      },
      'path/to/two.js': 'two.js content',
      'path/to/three': {}
    });

    assert.instanceOf(system, mock.FileSystem);

    var filepath, item;

    // confirm 'path/to/one' directory was created
    filepath = path.join('path', 'to', 'one');
    item = system.getItem(filepath);
    assert.instanceOf(item, Directory);
    assert.equal(item.getName(), 'one');
    assert.equal(item.getPath(), path.resolve(filepath));

    // confirm 'path/to/one/file.js' file was created
    filepath = path.join('path', 'to', 'one', 'file.js');
    item = system.getItem(filepath);
    assert.instanceOf(item, File);
    assert.equal(item.getName(), 'file.js');
    assert.equal(String(item.getContent()), 'file.js content');
    assert.equal(item.getPath(), path.resolve(filepath));

    // confirm 'path/to/one/dir' directory was created
    filepath = path.join('path', 'to', 'one', 'dir');
    item = system.getItem(filepath);
    assert.instanceOf(item, Directory);
    assert.equal(item.getName(), 'dir');
    assert.equal(item.getPath(), path.resolve(filepath));

    // confirm 'path/to/two.js' file was created
    filepath = path.join('path', 'to', 'two.js');
    item = system.getItem(filepath);
    assert.instanceOf(item, File);
    assert.equal(item.getName(), 'two.js');
    assert.equal(String(item.getContent()), 'two.js content');
    assert.equal(item.getPath(), path.resolve(filepath));

    // confirm 'path/to/three' directory was created
    filepath = path.join('path', 'to', 'three');
    item = system.getItem(filepath);
    assert.instanceOf(item, Directory);
    assert.equal(item.getName(), 'three');
    assert.equal(item.getPath(), path.resolve(filepath));

  });

  it('accepts file factory generator', function() {

    var system = mock.create({
      'path/to/file.js': mock.file({content: 'foo'})
    });

    assert.instanceOf(system, mock.FileSystem);

    var file = system.getItem(path.join('path', 'to', 'file.js'));
    assert.instanceOf(file, File);
    assert.equal(file.getName(), 'file.js');
    assert.equal(String(file.getContent()), 'foo');

  });

  it('accepts directory factory generator', function() {

    var system = mock.create({
      'path/to/dir': mock.directory()
    });

    assert.instanceOf(system, mock.FileSystem);

    var dir = system.getItem(path.join('path', 'to', 'dir'));
    assert.instanceOf(dir, Directory);
    assert.equal(dir.getName(), 'dir');

  });

});
