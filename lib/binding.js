'use strict';

var path = require('path');

var File = require('./file');
var FileDescriptor = require('./descriptor');
var Directory = require('./directory');
var SymbolicLink = require('./symlink');
var FSError = require('./error');

var constants = process.binding('constants');


/**
 * Call the provided function and either return the result or call the callback
 * with it (depending on if a callback is provided).
 * @param {function()} callback Optional callback.
 * @param {Object} thisArg This argument for the following function.
 * @param {function()} func Function to call.
 * @return {*} Return (if callback is not provided).
 */
function maybeCallback(callback, thisArg, func) {
  if (callback) {
    var err = null;
    var val;
    try {
      val = func.call(thisArg);
    } catch (e) {
      err = e;
    }
    // Unpack callback from FSReqWrap
    callback = callback.oncomplete || callback;
    process.nextTick(function() {
      if (val === undefined) {
        callback(err);
      } else {
        callback(err, val);
      }
    });
  } else {
    return func.call(thisArg);
  }
}

function notImplemented() {
  throw new Error('Method not implemented');
}


/**
 * Create a new stats object.
 * @param {Object} config Stats properties.
 * @constructor
 */
function Stats(config) {
  for (var key in config) {
    this[key] = config[key];
  }
}


/**
 * Check if mode indicates property.
 * @param {number} property Property to check.
 * @return {boolean} Property matches mode.
 */
Stats.prototype._checkModeProperty = function(property) {
  return ((this.mode & constants.S_IFMT) === property);
};


/**
 * @return {Boolean} Is a directory.
 */
Stats.prototype.isDirectory = function() {
  return this._checkModeProperty(constants.S_IFDIR);
};


/**
 * @return {Boolean} Is a regular file.
 */
Stats.prototype.isFile = function() {
  return this._checkModeProperty(constants.S_IFREG);
};


/**
 * @return {Boolean} Is a block device.
 */
Stats.prototype.isBlockDevice = function() {
  return this._checkModeProperty(constants.S_IFBLK);
};


/**
 * @return {Boolean} Is a character device.
 */
Stats.prototype.isCharacterDevice = function() {
  return this._checkModeProperty(constants.S_IFCHR);
};


/**
 * @return {Boolean} Is a symbolic link.
 */
Stats.prototype.isSymbolicLink = function() {
  return this._checkModeProperty(constants.S_IFLNK);
};


/**
 * @return {Boolean} Is a named pipe.
 */
Stats.prototype.isFIFO = function() {
  return this._checkModeProperty(constants.S_IFIFO);
};


/**
 * @return {Boolean} Is a socket.
 */
Stats.prototype.isSocket = function() {
  return this._checkModeProperty(constants.S_IFSOCK);
};


/**
 * Create a new binding with the given file system.
 * @param {FileSystem} system Mock file system.
 * @constructor
 */
function Binding(system) {

  /**
   * Mock file system.
   * @type {FileSystem}
   */
  this._system = system;

  /**
   * Stats constructor.
   * @type {function}
   */
  this.Stats = Stats;

  /**
   * Lookup of open files.
   * @type {Object.<number, FileDescriptor>}
   */
  this._openFiles = {};

  /**
   * Counter for file descriptors.
   * @type {number}
   */
  this._counter = 0;

}


/**
 * Get the file system underlying this binding.
 * @return {FileSystem} The underlying file system.
 */
Binding.prototype.getSystem = function() {
  return this._system;
};


/**
 * Reset the file system underlying this binding.
 * @param {FileSystem} system The new file system.
 */
Binding.prototype.setSystem = function(system) {
  this._system = system;
};


/**
 * Get a file descriptor.
 * @param {number} fd File descriptor identifier.
 * @return {FileDescriptor} File descriptor.
 */
Binding.prototype._getDescriptorById = function(fd) {
  if (!this._openFiles.hasOwnProperty(fd)) {
    throw new FSError('EBADF');
  }
  return this._openFiles[fd];
};


/**
 * Keep track of a file descriptor as open.
 * @param {FileDescriptor} descriptor The file descriptor.
 * @return {number} Identifier for file descriptor.
 */
Binding.prototype._trackDescriptor = function(descriptor) {
  var fd = ++this._counter;
  this._openFiles[fd] = descriptor;
  return fd;
};


/**
 * Stop tracking a file descriptor as open.
 * @param {number} fd Identifier for file descriptor.
 */
Binding.prototype._untrackDescriptorById = function(fd) {
  if (!this._openFiles.hasOwnProperty(fd)) {
    throw new FSError('EBADF');
  }
  delete this._openFiles[fd];
};


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.stat = function(filepath, callback) {
  return maybeCallback(callback, this, function() {
    var item = this._system.getItem(filepath);
    if (item instanceof SymbolicLink) {
      item = this._system.getItem(
          path.resolve(path.dirname(filepath), item.getPath()));
    }
    if (!item) {
      throw new FSError('ENOENT', filepath);
    }
    return new Stats(item.getStats());
  });
};


/**
 * Stat an item.
 * @param {number} fd File descriptor.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.fstat = function(fd, callback) {
  return maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    var item = descriptor.getItem();
    return new Stats(item.getStats());
  });
};


/**
 * Close a file descriptor.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Callback (optional).
 */
Binding.prototype.close = function(fd, callback) {
  maybeCallback(callback, this, function() {
    this._untrackDescriptorById(fd);
  });
};


/**
 * Open and possibly create a file.
 * @param {string} pathname File path.
 * @param {number} flags Flags.
 * @param {number} mode Mode.
 * @param {function(Error, string)} callback Callback (optional).
 * @return {string} File descriptor (if sync).
 */
Binding.prototype.open = function(pathname, flags, mode, callback) {
  return maybeCallback(callback, this, function() {
    var descriptor = new FileDescriptor(flags);
    var item = this._system.getItem(pathname);
    if (item instanceof SymbolicLink) {
      item = this._system.getItem(
          path.resolve(path.dirname(pathname), item.getPath()));
    }
    if (descriptor.isExclusive() && item) {
      throw new FSError('EEXIST', pathname);
    }
    if (descriptor.isCreate() && !item) {
      var parent = this._system.getItem(path.dirname(pathname));
      if (!parent) {
        throw new FSError('ENOENT', pathname);
      }
      if (!(parent instanceof Directory)) {
        throw new FSError('ENOTDIR', pathname);
      }
      item = new File();
      if (mode) {
        item.setMode(mode);
      }
      parent.addItem(path.basename(pathname), item);
    }
    if (descriptor.isRead()) {
      if (!item) {
        throw new FSError('ENOENT', pathname);
      }
      if (!item.canRead()) {
        throw new FSError('EACCES', pathname);
      }
    }
    if (descriptor.isWrite() && !item.canWrite()) {
      throw new FSError('EACCES', pathname);
    }
    if (descriptor.isTruncate()) {
      item.setContent('');
    }
    if (descriptor.isTruncate() || descriptor.isAppend()) {
      descriptor.setPosition(item.getContent().length);
    }
    descriptor.setItem(item);
    return this._trackDescriptor(descriptor);
  });
};


/**
 * Read from a file descriptor.
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer that the contents will be written to.
 * @param {number} offset Offset in the buffer to start writing to.
 * @param {number} length Number of bytes to read.
 * @param {?number} position Where to begin reading in the file.  If null,
 *     data will be read from the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes read, and the buffer.
 * @return {number} Number of bytes read (if sync).
 */
Binding.prototype.read = function(fd, buffer, offset, length, position,
    callback) {
  return maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    if (!descriptor.isRead()) {
      throw new FSError('EBADF');
    }
    var file = descriptor.getItem();
    if (!(file instanceof File)) {
      // deleted or not a regular file
      throw new FSError('EBADF');
    }
    if (typeof position !== 'number' || position < 0) {
      position = descriptor.getPosition();
    }
    var content = file.getContent();
    var start = Math.min(position, content.length);
    var end = Math.min(position + length, content.length);
    var read = (start < end) ? content.copy(buffer, offset, start, end) : 0;
    descriptor.setPosition(position + read);
    return read;
  });
};


/**
 * Write to a file descriptor given a buffer.
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer with contents to write.
 * @param {number} offset Offset in the buffer to start writing from.
 * @param {number} length Number of bytes to write.
 * @param {?number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes written, and the buffer.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeBuffer = function(fd, buffer, offset, length, position,
    callback) {
  return maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    if (!descriptor.isWrite()) {
      throw new FSError('EBADF');
    }
    var file = descriptor.getItem();
    if (!(file instanceof File)) {
      // not a regular file
      throw new FSError('EBADF');
    }
    if (typeof position !== 'number' || position < 0) {
      position = descriptor.getPosition();
    }
    var content = file.getContent();
    var newLength = position + length;
    if (content.length < newLength) {
      var newContent = new Buffer(newLength);
      content.copy(newContent);
      content = newContent;
    }
    var sourceEnd = Math.min(offset + length, buffer.length);
    var written = buffer.copy(content, position, offset, sourceEnd);
    file.setContent(content);
    descriptor.setPosition(newLength);
    return written;
  });
};


/**
 * Alias for writeBuffer (used in Node <= 0.10).
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer with contents to write.
 * @param {number} offset Offset in the buffer to start writing from.
 * @param {number} length Number of bytes to write.
 * @param {?number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes written, and the buffer.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.write = Binding.prototype.writeBuffer;


/**
 * Write to a file descriptor given a string.
 * @param {string} fd File descriptor.
 * @param {string} string String with contents to write.
 * @param {number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {string} encoding String encoding.
 * @param {function(Error, number, string)} callback Callback (optional) called
 *     with any error, number of bytes written, and the string.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeString = function(fd, string, position, encoding,
    callback) {
  var buffer = new Buffer(string, encoding);
  var wrapper;
  if (callback) {
    callback = callback.oncomplete || callback;
    wrapper = function(err, written, returned) {
      callback(err, written, returned && string);
    };
  }
  return this.writeBuffer(fd, buffer, 0, string.length, position, wrapper);
};


/**
 * Rename a file.
 * @param {string} oldPath Old pathname.
 * @param {string} newPath New pathname.
 * @param {function(Error)} callback Callback (optional).
 * @return {undefined}
 */
Binding.prototype.rename = function(oldPath, newPath, callback) {
  return maybeCallback(callback, this, function() {
    var oldItem = this._system.getItem(oldPath);
    if (!oldItem) {
      throw new FSError('ENOENT', oldPath);
    }
    var oldParent = this._system.getItem(path.dirname(oldPath));
    var oldName = path.basename(oldPath);
    var newItem = this._system.getItem(newPath);
    var newParent = this._system.getItem(path.dirname(newPath));
    var newName = path.basename(newPath);
    if (newItem) {
      // make sure they are the same type
      if (oldItem instanceof File) {
        if (newItem instanceof Directory) {
          throw new FSError('EISDIR', newPath);
        }
      } else if (oldItem instanceof Directory) {
        if (!(newItem instanceof Directory)) {
          throw new FSError('ENOTDIR', newPath);
        }
        if (newItem.list().length > 0) {
          throw new FSError('ENOTEMPTY', newPath);
        }
      }
      newParent.removeItem(newName);
    } else {
      if (!newParent) {
        throw new FSError('ENOENT', newPath);
      }
      if (!(newParent instanceof Directory)) {
        throw new FSError('ENOTDIR', newPath);
      }
    }
    oldParent.removeItem(oldName);
    newParent.addItem(newName, oldItem);
  });
};


/**
 * Read a directory.
 * @param {string} dirpath Path to directory.
 * @param {function(Error, Array.<string>)} callback Callback (optional) called
 *     with any error or array of items in the directory.
 * @return {Array.<string>} Array of items in directory (if sync).
 */
Binding.prototype.readdir = function(dirpath, callback) {
  return maybeCallback(callback, this, function() {
    var dpath = dirpath;
    var dir = this._system.getItem(dirpath);
    while (dir instanceof SymbolicLink) {
      dpath = path.resolve(path.dirname(dpath), dir.getPath());
      dir = this._system.getItem(dpath);
    }
    if (!dir) {
      throw new FSError('ENOENT', dirpath);
    }
    if (!(dir instanceof Directory)) {
      throw new FSError('ENOTDIR', dirpath);
    }
    return dir.list();
  });
};


/**
 * Create a directory.
 * @param {string} pathname Path to new directory.
 * @param {number} mode Permissions.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.mkdir = function(pathname, mode, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(pathname);
    if (item) {
      throw new FSError('EEXIST', pathname);
    }
    var parent = this._system.getItem(path.dirname(pathname));
    if (!parent) {
      throw new FSError('ENOENT', pathname);
    }
    var dir = new Directory();
    if (mode) {
      dir.setMode(mode);
    }
    parent.addItem(path.basename(pathname), dir);
  });
};


/**
 * Remove a directory.
 * @param {string} pathname Path to directory.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.rmdir = function(pathname, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    if (!(item instanceof Directory)) {
      throw new FSError('ENOTDIR', pathname);
    }
    if (item.list().length > 0) {
      throw new FSError('ENOTEMPTY', pathname);
    }
    var parent = this._system.getItem(path.dirname(pathname));
    parent.removeItem(path.basename(pathname));
  });
};


/**
 * Truncate a file.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.ftruncate = function(fd, len, callback) {
  maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    if (!descriptor.isWrite()) {
      throw new FSError('EINVAL');
    }
    var file = descriptor.getItem();
    if (!(file instanceof File)) {
      throw new FSError('EINVAL');
    }
    var content = file.getContent();
    var newContent = new Buffer(len);
    content.copy(newContent);
    file.setContent(newContent);
  });
};


/**
 * Legacy support.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.truncate = Binding.prototype.ftruncate;


/**
 * Change user and group owner.
 * @param {string} pathname Path.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.chown = function(pathname, uid, gid, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    item.setUid(uid);
    item.setGid(gid);
  });
};


/**
 * Change user and group owner.
 * @param {number} fd File descriptor.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fchown = function(fd, uid, gid, callback) {
  maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    var item = descriptor.getItem();
    item.setUid(uid);
    item.setGid(gid);
  });
};


/**
 * Change permissions.
 * @param {string} pathname Path.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.chmod = function(pathname, mode, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    item.setMode(mode);
  });
};


/**
 * Change permissions.
 * @param {number} fd File descriptor.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fchmod = function(fd, mode, callback) {
  maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    var item = descriptor.getItem();
    item.setMode(mode);
  });
};


/**
 * Delete a named item.
 * @param {string} pathname Path to item.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.unlink = function(pathname, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    if (item instanceof Directory) {
      throw new FSError('EPERM', pathname);
    }
    var parent = this._system.getItem(path.dirname(pathname));
    parent.removeItem(path.basename(pathname));
  });
};


/**
 * Update timestamps.
 * @param {string} pathname Path to item.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.utimes = function(pathname, atime, mtime, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    item.setATime(new Date(atime * 1000));
    item.setMTime(new Date(mtime * 1000));
  });
};


/**
 * Update timestamps.
 * @param {number} fd File descriptor.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.futimes = function(fd, atime, mtime, callback) {
  maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    var item = descriptor.getItem();
    item.setATime(new Date(atime * 1000));
    item.setMTime(new Date(mtime * 1000));
  });
};


/**
 * Synchronize in-core state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fsync = function(fd, callback) {
  maybeCallback(callback, this, function() {
    this._getDescriptorById(fd);
  });
};


/**
 * Synchronize in-core metadata state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.fdatasync = function(fd, callback) {
  maybeCallback(callback, this, function() {
    this._getDescriptorById(fd);
  });
};


/**
 * Create a hard link.
 * @param {string} srcPath The existing file.
 * @param {string} destPath The new link to create.
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.link = function(srcPath, destPath, callback) {
  maybeCallback(callback, this, function() {
    var item = this._system.getItem(srcPath);
    if (!item) {
      throw new FSError('ENOENT', srcPath);
    }
    if (item instanceof Directory) {
      throw new FSError('EPERM', srcPath);
    }
    if (this._system.getItem(destPath)) {
      throw new FSError('EEXIST', destPath);
    }
    var parent = this._system.getItem(path.dirname(destPath));
    if (!parent) {
      throw new FSError('ENOENT', destPath);
    }
    if (!(parent instanceof Directory)) {
      throw new FSError('ENOTDIR', destPath);
    }
    parent.addItem(path.basename(destPath), item);
  });
};


/**
 * Create a symbolic link.
 * @param {string} srcPath Path from link to the source file.
 * @param {string} destPath Path for the generated link.
 * @param {string} type Ignored (used for Windows only).
 * @param {function(Error)} callback Optional callback.
 */
Binding.prototype.symlink = function(srcPath, destPath, type, callback) {
  maybeCallback(callback, this, function() {
    if (this._system.getItem(destPath)) {
      throw new FSError('EEXIST', destPath);
    }
    var parent = this._system.getItem(path.dirname(destPath));
    if (!parent) {
      throw new FSError('ENOENT', destPath);
    }
    if (!(parent instanceof Directory)) {
      throw new FSError('ENOTDIR', destPath);
    }
    var link = new SymbolicLink();
    link.setPath(srcPath);
    parent.addItem(path.basename(destPath), link);
  });
};


/**
 * Read the contents of a symbolic link.
 * @param {string} pathname Path to symbolic link.
 * @param {function(Error, string)} callback Optional callback.
 * @return {string} Symbolic link contents (path to source).
 */
Binding.prototype.readlink = function(pathname, callback) {
  return maybeCallback(callback, this, function() {
    var link = this._system.getItem(pathname);
    if (!(link instanceof SymbolicLink)) {
      throw new FSError('EINVAL', pathname);
    }
    return link.getPath();
  });
};


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.lstat = function(filepath, callback) {
  return maybeCallback(callback, this, function() {
    var item = this._system.getItem(filepath);
    if (!item) {
      throw new FSError('ENOENT', filepath);
    }
    return new Stats(item.getStats());
  });
};


/**
 * Not yet implemented.
 * @type {function()}
 */
Binding.prototype.StatWatcher = notImplemented;


/**
 * Export the binding constructor.
 * @type {function()}
 */
exports = module.exports = Binding;
