'use strict';

const os = require('os');
const path = require('path');
const Directory = require('./directory.js');
const File = require('./file.js');
const {FSError} = require('./error.js');
const SymbolicLink = require('./symlink.js');

const isWindows = process.platform === 'win32';

// on Win32, change filepath from \\?\c:\a\b to C:\a\b
function getRealPath(filepath) {
  if (isWindows && filepath.startsWith('\\\\?\\')) {
    // Remove win32 file namespace prefix \\?\
    return filepath[4].toUpperCase() + filepath.slice(5);
  }
  return filepath;
}

function getPathParts(filepath) {
  // path.toNamespacedPath is only for Win32 system.
  // on other platform, it returns the path unmodified.
  const parts = path.toNamespacedPath(path.resolve(filepath)).split(path.sep);
  parts.shift();
  if (isWindows) {
    // parts currently looks like ['', '?', 'c:', ...]
    parts.shift();
    const q = parts.shift(); // should be '?'
    // https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file?redirectedfrom=MSDN#win32-file-namespaces
    // Win32 File Namespaces prefix \\?\
    const base = '\\\\' + q + '\\' + parts.shift().toLowerCase();
    parts.unshift(base);
  }
  if (parts[parts.length - 1] === '') {
    parts.pop();
  }
  return parts;
}

/**
 * Create a new file system.
 * @param {object} options Any filesystem options.
 * @param {boolean} options.createCwd Create a directory for `process.cwd()`
 *     (defaults to `true`).
 * @param {boolean} options.createTmp Create a directory for `os.tmpdir()`
 *     (defaults to `true`).
 * @class
 */
function FileSystem(options) {
  options = options || {};

  const createCwd = 'createCwd' in options ? options.createCwd : true;
  const createTmp = 'createTmp' in options ? options.createTmp : true;

  const root = new Directory();

  // populate with default directories
  const defaults = [];
  if (createCwd) {
    defaults.push(process.cwd());
  }

  if (createTmp) {
    defaults.push((os.tmpdir && os.tmpdir()) || os.tmpDir());
  }

  defaults.forEach(function (dir) {
    const parts = getPathParts(dir);
    let directory = root;
    for (let i = 0, ii = parts.length; i < ii; ++i) {
      const name = parts[i];
      const candidate = directory.getItem(name);
      if (!candidate) {
        directory = directory.addItem(name, new Directory());
      } else if (candidate instanceof Directory) {
        directory = candidate;
      } else {
        throw new Error('Failed to create directory: ' + dir);
      }
    }
  });

  /**
   * Root directory.
   * @type {Directory}
   */
  this._root = root;
}

/**
 * Get the root directory.
 * @return {Directory} The root directory.
 */
FileSystem.prototype.getRoot = function () {
  return this._root;
};

/**
 * Get a file system item.
 * @param {string} filepath Path to item.
 * @return {Item} The item (or null if not found).
 */
FileSystem.prototype.getItem = function (filepath) {
  const parts = getPathParts(filepath);
  const currentParts = getPathParts(process.cwd());
  let item = this._root;
  let itemPath = '/';
  for (let i = 0, ii = parts.length; i < ii; ++i) {
    const name = parts[i];
    while (item instanceof SymbolicLink) {
      // Symbolic link being traversed as a directory --- If link targets
      // another symbolic link, resolve target's path relative to the original
      // link's target, otherwise relative to the current item.
      itemPath = path.resolve(path.dirname(itemPath), item.getPath());
      item = this.getItem(itemPath);
    }
    if (item) {
      if (item instanceof Directory && name !== currentParts[i]) {
        // make sure traversal is allowed
        // This fails for Windows directories which do not have execute permission, by default. It may be a good idea
        // to change this logic to windows-friendly. See notes in mock.createDirectoryInfoFromPaths()
        if (!item.canExecute()) {
          throw new FSError('EACCES', filepath);
        }
      }
      if (item instanceof File) {
        throw new FSError('ENOTDIR', filepath);
      }
      item = item.getItem(name);
    }
    if (!item) {
      break;
    }
    itemPath = path.resolve(itemPath, name);
  }
  return item;
};

function _getFilepath(item, itemPath, wanted) {
  if (item === wanted) {
    return itemPath;
  }
  if (item instanceof Directory) {
    for (const name of item.list()) {
      const got = _getFilepath(
        item.getItem(name),
        path.join(itemPath, name),
        wanted
      );
      if (got) {
        return got;
      }
    }
  }
  return null;
}

/**
 * Get file path from a file system item.
 * @param {Item} item a file system item.
 * @return {string} file path for the item (or null if not found).
 */
FileSystem.prototype.getFilepath = function (item) {
  const namespacedPath = _getFilepath(this._root, isWindows ? '' : '/', item);
  return getRealPath(namespacedPath);
};

/**
 * Populate a directory with an item.
 * @param {Directory} directory The directory to populate.
 * @param {string} name The name of the item.
 * @param {string | Buffer | Function | object} obj Instructions for creating the
 *     item.
 */
function populate(directory, name, obj) {
  let item;
  if (typeof obj === 'string' || Buffer.isBuffer(obj)) {
    // contents for a file
    item = new File();
    item.setContent(obj);
  } else if (typeof obj === 'function') {
    // item factory
    item = obj();
  } else if (typeof obj === 'object') {
    // directory with more to populate
    item = new Directory();
    for (const key in obj) {
      populate(item, key, obj[key]);
    }
  } else {
    throw new Error('Unsupported type: ' + typeof obj + ' of item ' + name);
  }

  /**
   * Special exception for redundant adding of empty directories.
   */
  if (
    item instanceof Directory &&
    item.list().length === 0 &&
    directory.getItem(name) instanceof Directory
  ) {
    // pass
  } else {
    directory.addItem(name, item);
  }
}

/**
 * Configure a mock file system.
 * @param {object} paths Config object.
 * @param {object} options Any filesystem options.
 * @param {boolean} options.createCwd Create a directory for `process.cwd()`
 *     (defaults to `true`).
 * @param {boolean} options.createTmp Create a directory for `os.tmpdir()`
 *     (defaults to `true`).
 * @return {FileSystem} Mock file system.
 */
FileSystem.create = function (paths, options) {
  const system = new FileSystem(options);

  for (const filepath in paths) {
    const parts = getPathParts(filepath);
    let directory = system._root;
    for (let i = 0, ii = parts.length - 1; i < ii; ++i) {
      const name = parts[i];
      const candidate = directory.getItem(name);
      if (!candidate) {
        directory = directory.addItem(name, new Directory());
      } else if (candidate instanceof Directory) {
        directory = candidate;
      } else {
        throw new Error('Failed to create directory: ' + filepath);
      }
    }
    populate(directory, parts[parts.length - 1], paths[filepath]);
  }

  return system;
};

/**
 * Generate a factory for new files.
 * @param {object} config File config.
 * @return {function():File} Factory that creates a new file.
 */
FileSystem.file = function (config) {
  config = config || {};
  return function () {
    const file = new File();
    if (config.hasOwnProperty('content')) {
      file.setContent(config.content);
    }
    if (config.hasOwnProperty('mode')) {
      file.setMode(config.mode);
    } else {
      file.setMode(438); // 0666
    }
    if (config.hasOwnProperty('uid')) {
      file.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      file.setGid(config.gid);
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
    if (config.hasOwnProperty('birthtime')) {
      file.setBirthtime(config.birthtime);
    }
    return file;
  };
};

/**
 * Generate a factory for new symbolic links.
 * @param {object} config File config.
 * @return {function():File} Factory that creates a new symbolic link.
 */
FileSystem.symlink = function (config) {
  config = config || {};
  return function () {
    const link = new SymbolicLink();
    if (config.hasOwnProperty('mode')) {
      link.setMode(config.mode);
    } else {
      link.setMode(438); // 0666
    }
    if (config.hasOwnProperty('uid')) {
      link.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      link.setGid(config.gid);
    }
    if (config.hasOwnProperty('path')) {
      link.setPath(config.path);
    } else {
      throw new Error('Missing "path" property');
    }
    if (config.hasOwnProperty('atime')) {
      link.setATime(config.atime);
    }
    if (config.hasOwnProperty('ctime')) {
      link.setCTime(config.ctime);
    }
    if (config.hasOwnProperty('mtime')) {
      link.setMTime(config.mtime);
    }
    if (config.hasOwnProperty('birthtime')) {
      link.setBirthtime(config.birthtime);
    }
    return link;
  };
};

/**
 * Generate a factory for new directories.
 * @param {object} config File config.
 * @return {function():Directory} Factory that creates a new directory.
 */
FileSystem.directory = function (config) {
  config = config || {};
  return function () {
    const dir = new Directory();
    if (config.hasOwnProperty('mode')) {
      dir.setMode(config.mode);
    }
    if (config.hasOwnProperty('uid')) {
      dir.setUid(config.uid);
    }
    if (config.hasOwnProperty('gid')) {
      dir.setGid(config.gid);
    }
    if (config.hasOwnProperty('items')) {
      for (const name in config.items) {
        populate(dir, name, config.items[name]);
      }
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
    if (config.hasOwnProperty('birthtime')) {
      dir.setBirthtime(config.birthtime);
    }
    return dir;
  };
};

/**
 * Module exports.
 * @type {Function}
 */
module.exports = FileSystem;
exports = module.exports;
exports.getPathParts = getPathParts;
exports.getRealPath = getRealPath;
