var path = require('path');

var Directory = require('./directory').Directory;
var File = require('./file').File;



/**
 * Create a new file system.
 * @constructor
 */
var FileSystem = exports.FileSystem = function FileSystem() {

  /**
   * Root directories.
   * @type {Object.<string, Directory>}
   */
  this._roots = {};

};


/**
 * Add a root directory.
 * @param {string} name Root name.
 * @return {Directory} The root directory.
 */
FileSystem.prototype.addRoot = function(name) {
  if (this._roots.hasOwnProperty(name)) {
    throw new Error('Root name already added: ' + name);
  }
  var root = new Directory(name);
  this._roots[name] = root;
  return root;
};


/**
 * Get a named root directory.
 * @param {string} name Root name.
 * @return {Directory} Root directory.
 */
FileSystem.prototype.getRoot = function(name) {
  var root = null;
  if (this._roots.hasOwnProperty(name)) {
    root = this._roots[name];
  }
  return root;
};


/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Item} The item (or null if not found).
 */
FileSystem.prototype.getItem = function(filepath) {
  var parts = path._makeLong(path.resolve(filepath)).split(path.sep);
  var item = this.getRoot(parts[0]);
  if (item) {
    for (var i = 1, ii = parts.length; i < ii; ++i) {
      item = item.getItem(parts[i]);
      if (!item) {
        break;
      }
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
    var parts = path._makeLong(path.resolve(filepath)).split(path.sep);
    var directory = system.getRoot(parts[0]);
    if (!directory) {
      directory = system.addRoot(parts[0]);
    }
    var i, ii, name, candidate;
    for (i = 1, ii = parts.length - 1; i < ii; ++i) {
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
    return dir;
  };
};


/**
 * Module exports.
 * @type {function}
 */
module.exports = FileSystem;
