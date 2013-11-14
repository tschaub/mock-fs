var path = require('path');

var File = require('./file').File;
var Directory = require('./directory').Directory;

var constants = process.binding('constants');


function noSuchFile(filepath, source) {
  var code = 'ENOENT';
  var errno = 34;
  var error = new Error(code + ', ' + source + '\'' + filepath + '\'');
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
 * @param {string} fd File descriptor.
 * @param {function(Error)} callback Callback (optional).
 */
Binding.prototype.close = notImplemented;


/**
 * Open and possibly create a file.
 * @param {string} pathname File path.
 * @param {number} flags Flags.
 * @param {number} mode Mode.
 * @param {function(Error, string)} callback Callback (optional).
 * @return {string} File descriptor (if sync).
 */
Binding.prototype.open = notImplemented;


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
Binding.prototype.read = notImplemented;


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
    var newItem = system.getItem(newPath);
    if (newItem) {
      // make sure they are the same type
      if (oldItem instanceof File) {
        if (newItem instanceof Directory) {
          // TODO: error factories
          throw new Error('EISDIR, illegal operation on a directory');
        }
      } else if (oldItem instanceof Directory) {
        if (newItem instanceof File) {
          throw new Error('ENOTDIR, not a directory');
        }
        if (newItem.list().length > 0) {
          throw new Error('ENOTEMPTY, directory not empty');
        }
      }
      var newParent = newItem.getParent();
      var newName = newItem.getName();
      var oldName = oldItem.getName();
      newParent.removeItem(newName);
      oldItem.getParent().removeItem(oldName);
      newParent.addItem(oldItem);
      newParent.renameItem(oldName, newName);
    } else {
      // TODO: check if parent exists
    }
  });
};
