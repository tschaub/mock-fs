var path = require('path');

var File = require('./file');
var FileDescriptor = require('./descriptor').FileDescriptor;
var Directory = require('./directory');

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
    process.nextTick(function() {
      var err = null;
      var val;
      try {
        val = func.call(thisArg);
      } catch (e) {
        err = e;
      }
      callback(err, val);
    });
  } else {
    return func.call(thisArg);
  }
}

function notImplemented() {
  throw new Error('Method not implemented');
}

function noSuchFile(filepath, source) {
  var code = 'ENOENT';
  var errno = 34;
  var error = new Error(code + ', ' + source + ' \'' + filepath + '\'');
  error.code = code;
  error.errno = errno;
  return error;
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
    throw new Error('EBADF, bad file descriptor');
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
    throw new Error('EBADF, bad file descriptor');
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
    if (!item) {
      throw noSuchFile(filepath, 'stat');
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
    if (descriptor.isExclusive() && item) {
      throw new Error('EEXIST, file already exists');
    }
    if (descriptor.isCreate() && !item) {
      var parent = this._system.getItem(path.dirname(pathname));
      if (!parent) {
        throw new Error('ENOENT, no such file or directory');
      }
      if (!(parent instanceof Directory)) {
        throw new Error('ENOTDIR, not a directory');
      }
      item = new File(path.basename(pathname));
      item.setMode(mode);
      parent.addItem(item);
    }
    if (descriptor.isRead() && !item) {
      throw new Error('ENOENT, no such file or directory');
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
      throw new Error('EBADF, bad file descriptor');
    }
    var file = descriptor.getItem();
    if (!(file instanceof File)) {
      // deleted or not a regular file
      throw new Error('EBADF, bad file descriptor');
    }
    if (typeof position !== 'number' || position < 0) {
      position = descriptor.getPosition();
    }
    var content = file.getContent();
    var start = Math.min(position, content.length - 1);
    var end = Math.min(position + length, content.length);
    var read = content.copy(buffer, offset, start, end);
    descriptor.setPosition(descriptor.getPosition() + read);
    return read;
  });
};


/**
 * Write to a file descriptor.
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
Binding.prototype.write = function(fd, buffer, offset, length, position,
    callback) {
  return maybeCallback(callback, this, function() {
    var descriptor = this._getDescriptorById(fd);
    if (!descriptor.isWrite()) {
      throw new Error('EBADF, bad file descriptor');
    }
    var file = descriptor.getItem();
    if (!(file instanceof File)) {
      // not a regular file
      throw new Error('EBADF, bad file descriptor');
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
      throw noSuchFile(oldPath, 'rename');
    }
    var newItem = this._system.getItem(newPath);
    var newParent, newName;
    if (newItem) {
      // make sure they are the same type
      if (oldItem instanceof File) {
        if (newItem instanceof Directory) {
          // TODO: error factories
          throw new Error('EISDIR, illegal operation on a directory');
        }
      } else if (oldItem instanceof Directory) {
        if (!(newItem instanceof Directory)) {
          throw new Error('ENOTDIR, not a directory');
        }
        if (newItem.list().length > 0) {
          throw new Error('ENOTEMPTY, directory not empty');
        }
      }
      newParent = newItem.getParent();
      newName = newItem.getName();
      newParent.removeItem(newItem);
    } else {
      newParent = this._system.getItem(path.dirname(newPath));
      if (!newParent) {
        throw new Error('ENOENT, no such file or directory');
      }
      if (!(newParent instanceof Directory)) {
        throw new Error('ENOTDIR, not a directory');
      }
      newName = path.basename(newPath);
    }
    oldItem.getParent().removeItem(oldItem);
    newParent.addItem(oldItem);
    newParent.renameItem(oldItem.getName(), newName);
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
    var dir = this._system.getItem(dirpath);
    if (!dir) {
      throw new Error('ENOENT, no such file or directory');
    }
    if (!(dir instanceof Directory)) {
      throw new Error('ENOTDIR, not a directory');
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
      throw new Error('EEXIST, file already exists');
    }
    var parent = this._system.getItem(path.dirname(pathname));
    if (!parent) {
      throw new Error('ENOENT, no such file or directory');
    }
    var dir = new Directory(path.basename(pathname));
    dir.setMode(mode);
    parent.addItem(dir);
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
      throw new Error('ENOENT, no such file or directory');
    }
    if (!(item instanceof Directory)) {
      throw new Error('ENOTDIR, not a directory');
    }
    if (item.list().length > 0) {
      throw new Error('ENOTEMPTY, directory not empty');
    }
    item.getParent().removeItem(item);
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
      throw new Error('EINVAL, invalid argument');
    }
    var file = descriptor.getItem();
    if (!(file instanceof File)) {
      throw new Error('EINVAL, invalid argument');
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
      throw new Error('ENOENT, no such file or directory');
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
      throw new Error('ENOENT, no such file or directory');
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
      throw new Error('ENOENT, no such file or directory');
    }
    if (item instanceof Directory) {
      throw new Error('EPERM, operation not permitted');
    }
    var parent = item.getParent();
    parent.removeItem(item);
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
      throw new Error('ENOENT, no such file or directory');
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
 * Export the binding constructor.
 * @type {function()}
 */
exports = module.exports = Binding;
