var path = require('path');

var Directory = require('./directory').Directory;
var File = require('./file');


var isWindows = process.platform === 'win32';

function getPathParts(filepath) {
  var parts = path._makeLong(path.resolve(filepath)).split(path.sep);
  parts.shift();
  if (isWindows) {
    parts.shift();
  }
  return parts;
}



/**
 * Create a new file system.
 * @constructor
 */
function FileSystem() {

  /**
   * Root directory.
   * @type {Directory}
   */
  this._root = new Directory('');

}


/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Item} The item (or null if not found).
 */
FileSystem.prototype.getItem = function(filepath) {
  var parts = getPathParts(filepath);
  var item = this._root;
  for (var i = 0, ii = parts.length; i < ii; ++i) {
    item = item.getItem(parts[i]);
    if (!item) {
      break;
    }
  }
  return item;
};


/**
 * Populate a directory with an item.
 * @param {Directory} directory The directory to populate.
 * @param {string} name The name of the item.
 * @param {string|Buffer|function|Object} obj Instructions for creating the
 *     item.
 */
function populate(directory, name, obj) {
  var item;
  if (typeof obj === 'string' || Buffer.isBuffer(obj)) {
    // contents for a file
    item = new File(name);
    item.setContent(obj);
  } else if (typeof obj === 'function') {
    // item factory
    item = obj(name);
  } else {
    // directory with more to populate
    item = new Directory(name);
    for (var key in obj) {
      populate(item, key, obj[key]);
    }
  }
  directory.addItem(item);
}


/**
 * Configure a mock file system.
 * @param {Object} paths Config object.
 * @return {FileSystem} Mock file system.
 */
FileSystem.create = function(paths) {
  var system = new FileSystem();

  for (var filepath in paths) {
    var parts = getPathParts(filepath);
    var directory = system._root;
    var i, ii, name, candidate;
    for (i = 0, ii = parts.length - 1; i < ii; ++i) {
      name = parts[i];
      candidate = directory.getItem(name);
      if (!candidate) {
        directory = directory.addItem(new Directory(name));
      } else if (candidate instanceof Directory) {
        directory = candidate;
      } else {
        throw new Error('Failed to create directory: ' + filepath);
      }
    }
    populate(directory, parts[i], paths[filepath]);
  }

  return system;
};


/**
 * Generate a factory for new files.
 * @param {Object} config File config.
 * @return {function(string):File} Factory that creates a new file given a name.
 */
FileSystem.file = function(config) {
  config = config || {};
  return function(name) {
    var file = new File(name);
    if (config.hasOwnProperty('content')) {
      file.setContent(config.content);
    }
    if (config.hasOwnProperty('mode')) {
      file.setMode(config.mode);
    } else {
      file.setMode(0666);
    }
    if (config.hasOwnProperty('atime')) {
      file.setATime(config.atime);
    }
    if (config.hasOwnProperty('ctime')) {
      file.setCTime(config.ctime);
    }
    if (config.hasOwnProperty('mtime')) {
      file.setMTime(config.mtime);
    }
    if (config.hasOwnProperty('uid')) {
      file.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      file.setGid(config.gid);
    }
    return file;
  };
};


/**
 * Generate a factory for new directories.
 * @param {Object} config File config.
 * @return {function(string):Directory} Factory that creates a new directory
 * given a name.
 */
FileSystem.directory = function(config) {
  config = config || {};
  return function(name) {
    var dir = new Directory(name);
    if (config.hasOwnProperty('mode')) {
      dir.setMode(config.mode);
    } else {
      dir.setMode(0777);
    }
    if (config.hasOwnProperty('atime')) {
      dir.setATime(config.atime);
    }
    if (config.hasOwnProperty('ctime')) {
      dir.setCTime(config.ctime);
    }
    if (config.hasOwnProperty('mtime')) {
      dir.setMTime(config.mtime);
    }
    if (config.hasOwnProperty('uid')) {
      dir.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      dir.setGid(config.gid);
    }
    if (config.hasOwnProperty('items')) {
      for (name in config.items) {
        populate(dir, name, config.items[name]);
      }
    }
    return dir;
  };
};


/**
 * Module exports.
 * @type {function}
 */
module.exports = FileSystem;
