var path = require('path');

var File = require('./file').File;
var FileDescriptor = require('./descriptor').FileDescriptor;
var Directory = require('./directory').Directory;

var constants = process.binding('constants');


function noSuchFile(filepath, source) {
  var code = 'ENOENT';
  var errno = 34;
  var error = new Error(code + ', ' + source + ' \'' + filepath + '\'');
  error.code = code;
  error.errno = errno;
  return error;
}


/**
 * Lookup of open files.
 * @type {Object.<number, FileDescriptor>}
 */
var openFiles = {};
var counter = 0;



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
var Binding = exports.Binding = function(system) {

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

};


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


function maybeCallback(callback, func) {
  if (callback) {
    process.nextTick(function() {
      var err = null;
      var val;
      try {
        val = func();
      } catch (e) {
        err = e;
      }
      callback(err, val);
    });
  } else {
    return func();
  }
}

function notImplemented() {
  throw new Error('Method not implemented');
}


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {Stats|undefined} Stats or undefined (if sync).
 */
Binding.prototype.stat = function(filepath, callback) {
  var system = this._system;
  return maybeCallback(callback, function() {
    var item = system.getItem(filepath);
    if (!item) {
      throw noSuchFile(filepath, 'stat');
    }
    return new Stats(item.getStats());
  });
};


/**
 * Close a file descriptor.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Callback (optional).
 */
Binding.prototype.close = function(fd, callback) {
  maybeCallback(callback, function() {
    if (!openFiles.hasOwnProperty(fd)) {
      throw new Error('EBADF, bad file descriptor');
    }
    delete openFiles[fd];
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
  var system = this._system;
  return maybeCallback(callback, function() {
    var descriptor = new FileDescriptor(pathname, flags);
    var file = system.getItem(pathname);
    if (descriptor.isExclusive() && file) {
      throw new Error('EEXIST, file already exists');
    }
    if (descriptor.isCreate() && !file) {
      var parent = system.getItem(path.dirname(pathname));
      if (!parent) {
        throw new Error('ENOENT, no such file or directory');
      }
      if (!(parent instanceof Directory)) {
        throw new Error('ENOTDIR, not a directory');
      }
      file = new File(path.basename(pathname));
      file.setMode(mode);
      parent.addItem(file);
    }
    if (descriptor.isRead() && !file) {
      throw new Error('ENOENT, no such file or directory');
    }
    if (descriptor.isWrite() && !descriptor.isAppend()) {
      file.setContent('');
    }
    if (descriptor.isAppend()) {
      descriptor.setPosition(file.getContent().size);
    }
    var fd = ++counter;
    openFiles[fd] = descriptor;
    return fd;
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
  var system = this._system;
  return maybeCallback(callback, function() {
    if (!openFiles.hasOwnProperty(fd)) {
      throw new Error('EBADF, bad file descriptor');
    }
    var descriptor = openFiles[fd];
    if (!descriptor.isRead()) {
      throw new Error('EBADF, bad file descriptor');
    }
    if (typeof position !== 'number') {
      position = descriptor.getPosition();
    }
    var file = system.getItem(descriptor.getPath());
    if (!(file instanceof File)) {
      // the file has been deleted since opening, nothing we can do here
      delete openFiles[fd];
      throw new Error('EBADF, bad file descriptor');
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
Binding.prototype.write = notImplemented;


/**
 * Rename a file.
 * @param {string} oldPath Old pathname.
 * @param {string} newPath New pathname.
 * @param {function(Error)} callback Callback (optional).
 * @return {undefined}
 */
Binding.prototype.rename = function(oldPath, newPath, callback) {
  var system = this._system;
  return maybeCallback(callback, function() {
    var oldItem = system.getItem(oldPath);
    if (!oldItem) {
      throw noSuchFile(oldPath, 'rename');
    }
    var oldName = oldItem.getName();
    var newItem = system.getItem(newPath);
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
      newParent.removeItem(newName);
    } else {
      newParent = system.getItem(path.dirname(newPath));
      if (!newParent) {
        throw new Error('ENOENT, no such file or directory');
      }
      if (!(newParent instanceof Directory)) {
        throw new Error('ENOTDIR, not a directory');
      }
      newName = path.basename(newPath);
    }
    oldItem.getParent().removeItem(oldName);
    newParent.addItem(oldItem);
    newParent.renameItem(oldName, newName);
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
  var system = this._system;
  return maybeCallback(callback, function() {
    var dir = system.getItem(dirpath);
    if (!dir) {
      throw new Error('ENOENT, no such file or directory');
    }
    if (!(dir instanceof Directory)) {
      throw new Error('ENOTDIR, not a directory');
    }
    return dir.list();
  });
};
